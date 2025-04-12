'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    Upload,
    X,
    Loader2,
    Save,
    Eye,
    ArrowLeft,
    Trash2
} from 'lucide-react';
import {
    collection,
    doc,
    setDoc,
    addDoc,
    updateDoc,
    getDoc,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { extractStorageFileName } from '../lib/utils';



// Simple slug generator
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const formatContentToHtml = (content) => {
    if (!content) return '';

    // Convert newlines to <p> tags
    const withParagraphs = content
        .split('\n\n')
        .filter(para => para.trim())
        .map(para => `<p>${para}</p>`)
        .join('');

    return withParagraphs;
};

export default function ArticleEditor({ articleId }) {
    const router = useRouter();
    const isEditMode = Boolean(articleId);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        category: 'news',
        author: '',
        date: new Date().toISOString().split('T')[0],
        status: 'published',  // CHANGED FROM 'draft' to 'published'
        slug: '',
        imageUrl: ''
    });

    // UI state
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [errors, setErrors] = useState({});
    const [isDirty, setIsDirty] = useState(false);
    const [originalSlug, setOriginalSlug] = useState('');

    // Refs
    const fileInputRef = useRef(null);

    // Fetch article data in edit mode
    useEffect(() => {
        async function fetchArticle() {
            if (!isEditMode) return;

            try {
                setLoading(true);
                const docRef = doc(db, "articles", articleId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    router.push('/admin/articles');
                    return;
                }

                const articleData = docSnap.data();
                setFormData({
                    ...articleData,
                    date: articleData.date ? new Date(articleData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                });

                setOriginalSlug(articleData.slug);
                setPreviewUrl(articleData.imageUrl || '');

            } catch (error) {
                console.error("Error fetching article:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchArticle();
    }, [articleId, isEditMode, router]);

    // Update slug when title changes
    useEffect(() => {
        if (!isEditMode || (isEditMode && !originalSlug)) return;

        // Only auto-update slug if it hasn't been manually edited
        if (formData.slug === originalSlug || !formData.slug) {
            const newSlug = generateSlug(formData.title);
            setFormData(prev => ({ ...prev, slug: newSlug }));
        }
    }, [formData.title, isEditMode, originalSlug]);

    // Track form changes
    useEffect(() => {
        setIsDirty(true);
    }, [formData, imageFile]);

    // Handle input changes
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        // Special handling for title to auto-generate slug in create mode
        if (name === 'title' && !isEditMode) {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                slug: generateSlug(value)
            }));
        }
    };

    // Handle file selection
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setErrors(prev => ({
                    ...prev,
                    image: 'Image must be less than 5MB'
                }));
                return;
            }

            // Clear previous error
            if (errors.image) {
                setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.image;
                    return newErrors;
                });
            }

            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Remove image
    const handleRemoveImage = () => {
        setImageFile(null);

        if (!isEditMode || !formData.imageUrl) {
            setPreviewUrl('');
        } else {
            // In edit mode, revert to original image if one exists
            setPreviewUrl(formData.imageUrl);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Delete image permanently from storage and form
    const handleDeleteImage = async () => {
        if (!formData.imageUrl) return;

        try {
            // Extract file name from URL using the utility
            const fileName = extractStorageFileName(formData.imageUrl);

            if (fileName) {
                const fileRef = ref(storage, `articles/${fileName}`);
                // Delete from storage
                await deleteObject(fileRef);

                // Update form data
                setFormData({
                    ...formData,
                    imageUrl: ''
                });
                setPreviewUrl('');
            } else {
                console.warn('Could not extract filename from URL:', formData.imageUrl);
                setError('Failed to delete image: Invalid file path');
            }
        } catch (error) {
            console.error("Error deleting image:", error);
            setError('Failed to delete image. Please try again.');
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Content is required';
        }

        if (!formData.slug.trim()) {
            newErrors.slug = 'Slug is required';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const processContentForStorage = (rawContent) => {
        // If using a simple textarea, preserve paragraphs by storing them with proper break markers
        return rawContent.trim();

        // Note: If you're using a rich text editor, this may not be necessary as it will
        // already include proper HTML formatting
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }

        try {
            setSaving(true);

            // Upload image if provided
            let imageUrl = formData.imageUrl;

            if (imageFile) {
                const storageRef = ref(storage, `articles/${Date.now()}_${imageFile.name}`);
                const uploadTask = uploadBytesResumable(storageRef, imageFile);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            setUploadProgress(progress);
                        },
                        (error) => {
                            console.error("Upload error:", error);
                            reject(error);
                        },
                        () => {
                            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
                                imageUrl = url;
                                resolve();
                            });
                        }
                    );
                });
            }

            // Prepare article data
            const articleData = {
                ...formData,
                imageUrl,
                content: processContentForStorage(formData.content),
                updatedAt: serverTimestamp(),
            };

            // Handle new article or update
            if (isEditMode) {
                const docRef = doc(db, "articles", articleId);
                await updateDoc(docRef, articleData);
            } else {
                articleData.createdAt = serverTimestamp();
                await addDoc(collection(db, "articles"), articleData);
            }

            // Redirect to articles list
            router.push('/admin/articles');

        } catch (error) {
            console.error("Error saving article:", error);
            setErrors({ submit: "Failed to save article. Please try again." });
        } finally {
            setSaving(false);
        }
    };
    // Handle preview
    const handlePreview = () => {
        // Format content for preview
        const formattedContent = formatContentToHtml(formData.content);

        // Save current form to session storage for preview page
        sessionStorage.setItem('articlePreview', JSON.stringify({
            ...formData,
            content: formattedContent,
            previewUrl: previewUrl || formData.imageUrl
        }));

        // Open preview in new tab
        window.open('/admin/articles/preview', '_blank');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 size={32} className="animate-spin text-black/40" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form header */}
            <div className="bg-white p-4 rounded-md border border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <button
                    type="button"
                    onClick={() => router.push('/admin/articles')}
                    className="text-black/70 hover:text-black inline-flex items-center transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Articles
                </button>

                <div className="flex items-center space-x-3">
                    <button
                        type="button"
                        onClick={handlePreview}
                        disabled={saving}
                        className="bg-black/10 text-black py-2 px-4 rounded-md hover:bg-black/20 transition-colors inline-flex items-center text-sm"
                    >
                        <Eye size={16} className="mr-1" />
                        Preview
                    </button>

                    <button
                        type="submit"
                        disabled={saving || !isDirty}
                        className="bg-black text-white py-2 px-4 rounded-md hover:bg-black/80 transition-colors inline-flex items-center text-sm disabled:bg-black/40"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin mr-1" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-1" />
                                {isEditMode ? 'Update' : 'Publish'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main form content in two columns on large screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column - Main content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General error message */}
                    {errors.submit && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-md text-sm">
                            {errors.submit}
                        </div>
                    )}

                    {/* Title */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label htmlFor="title" className="block text-sm font-medium mb-2 text-black/70">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border ${errors.title ? 'border-red-400' : 'border-black/20'} focus:border-black outline-none transition-colors`}
                            placeholder="Enter article title"
                        />
                        {errors.title && (
                            <p className="mt-1 text-red-600 text-sm">{errors.title}</p>
                        )}
                    </div>

                    {/* Short description */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label htmlFor="description" className="block text-sm font-medium mb-2 text-black/70">
                            Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="3"
                            className={`w-full px-3 py-2 border ${errors.description ? 'border-red-400' : 'border-black/20'} focus:border-black outline-none transition-colors`}
                            placeholder="Enter a brief description of the article"
                        ></textarea>
                        {errors.description ? (
                            <p className="mt-1 text-red-600 text-sm">{errors.description}</p>
                        ) : (
                            <p className="mt-1 text-xs text-black/50">This will be displayed in article previews</p>
                        )}
                    </div>

                    {/* Article content */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label htmlFor="content" className="block text-sm font-medium mb-2 text-black/70">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            id="content"
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            rows="12"
                            className={`w-full px-3 py-2 border ${errors.content ? 'border-red-400' : 'border-black/20'} focus:border-black outline-none transition-colors font-sans`}
                            placeholder="Write your article content here"
                        ></textarea>
                        {errors.content && (
                            <p className="mt-1 text-red-600 text-sm">{errors.content}</p>
                        )}
                    </div>
                </div>

                {/* Right column - Metadata and settings */}
                <div className="space-y-6">
                    {/* Article status */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <h3 className="text-sm font-medium mb-4 text-black/70">
                            Status
                        </h3>
                        <div className="space-y-2">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="status"
                                    value="published"
                                    checked={formData.status === 'published'}
                                    onChange={handleChange}
                                    className="text-black focus:ring-0 focus:ring-offset-0"
                                />
                                <span>Published</span>
                            </label>
                            <label className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    name="status"
                                    value="draft"
                                    checked={formData.status === 'draft'}
                                    onChange={handleChange}
                                    className="text-black focus:ring-0 focus:ring-offset-0"
                                />
                                <span>Draft</span>
                            </label>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label htmlFor="category" className="block text-sm font-medium mb-2 text-black/70">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-black/20 focus:border-black outline-none transition-colors"
                        >
                            <option value="news">News</option>
                            <option value="ae">Arts & Entertainment</option>
                            <option value="forum">Forum</option>
                            <option value="sports">Sports</option>
                        </select>
                    </div>

                    {/* Author */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label htmlFor="author" className="block text-sm font-medium mb-2 text-black/70">
                            Author
                        </label>
                        <input
                            type="text"
                            id="author"
                            name="author"
                            value={formData.author}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-black/20 focus:border-black outline-none transition-colors"
                            placeholder="Enter author name"
                        />
                    </div>

                    {/* Date */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label htmlFor="date" className="block text-sm font-medium mb-2 text-black/70">
                            Publish Date <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            id="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border ${errors.date ? 'border-red-400' : 'border-black/20'} focus:border-black outline-none transition-colors`}
                        />
                        {errors.date && (
                            <p className="mt-1 text-red-600 text-sm">{errors.date}</p>
                        )}
                    </div>

                    {/* URL Slug */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label htmlFor="slug" className="block text-sm font-medium mb-2 text-black/70">
                            URL Slug <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="slug"
                            name="slug"
                            value={formData.slug}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border ${errors.slug ? 'border-red-400' : 'border-black/20'} focus:border-black outline-none transition-colors`}
                            placeholder="article-url-slug"
                        />
                        {errors.slug ? (
                            <p className="mt-1 text-red-600 text-sm">{errors.slug}</p>
                        ) : (
                            <p className="mt-1 text-xs text-black/50">Will be used in the article URL</p>
                        )}
                    </div>

                    {/* Featured Image */}
                    <div className="bg-white p-6 rounded-md border border-black/10">
                        <label className="block text-sm font-medium mb-3 text-black/70">
                            Featured Image
                        </label>

                        {previewUrl ? (
                            <div className="mb-4">
                                <div className="relative rounded-md overflow-hidden border border-black/10 h-[200px] w-full mb-2">
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {formData.imageUrl && !imageFile && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteImage}
                                        className="text-red-600 text-xs flex items-center"
                                    >
                                        <Trash2 size={12} className="mr-1" />
                                        Permanently Delete Image
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-black/20 rounded-md p-8 text-center cursor-pointer hover:border-black/40 transition-colors"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="image"
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Upload size={24} className="mx-auto mb-2 text-black/40" />
                                <p className="text-sm text-black/60 mb-1">Click to upload image</p>
                                <p className="text-xs text-black/40">JPG, PNG, GIF (max 5MB)</p>
                            </div>
                        )}

                        {errors.image && (
                            <p className="mt-2 text-red-600 text-sm">{errors.image}</p>
                        )}
                    </div>
                </div>
            </div>
        </form>
    );
}
'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronUpIcon, ChevronDownIcon, UploadIcon, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    collection,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

// Simple slug generator function
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')     // Replace spaces with hyphens
        .replace(/-+/g, '-')      // Replace multiple hyphons with single
        .trim()                   // Remove whitespace from both ends
        .substring(0, 80);        // Limit length
};

export default function PublishPage() {
    // Form data state
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        fullArticle: '',
        authorName: '',
        category: 'news',
        mediaFile: null
    });

    // Form validation state
    const [formErrors, setFormErrors] = useState({});

    // UI state
    const [expanded, setExpanded] = useState({
        guidelines: false,
        process: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    // Refs
    const fileInputRef = useRef(null);
    const formRef = useRef(null);

    // Handle text input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error for this field when user types
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Accordion toggle
    const handleToggleSection = (section) => {
        setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
    };

    // Handle file upload
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileSelection(file);
        }
    };

    // Process selected file
    const handleFileSelection = (file) => {
        // Only accept images
        if (!file.type.startsWith('image/')) {
            setFormErrors(prev => ({
                ...prev,
                mediaFile: 'Please upload an image file (JPEG, PNG, etc.)'
            }));
            return;
        }

        // Clear any previous error
        if (formErrors.mediaFile) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.mediaFile;
                return newErrors;
            });
        }

        // Create a preview URL for the image
        const fileUrl = URL.createObjectURL(file);
        setPreviewUrl(fileUrl);
        setFormData(prev => ({ ...prev, mediaFile: file }));
    };

    // Handle drag and drop
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, []);

    // Remove uploaded image
    const handleRemoveImage = () => {
        setPreviewUrl(null);
        setFormData(prev => ({ ...prev, mediaFile: null }));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Validate the form
    const validateForm = () => {
        const errors = {};

        if (!formData.title.trim()) {
            errors.title = 'Title is required';
        } else if (formData.title.length < 5) {
            errors.title = 'Title must be at least 5 characters';
        }

        if (!formData.shortDescription.trim()) {
            errors.shortDescription = 'Short description is required';
        } else if (formData.shortDescription.length < 50) {
            errors.shortDescription = 'Description must be at least 50 characters';
        }

        if (!formData.fullArticle.trim()) {
            errors.fullArticle = 'Article content is required';
        } else if (formData.fullArticle.length < 300) {
            errors.fullArticle = 'Article must be at least 300 characters';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = Object.keys(formErrors)[0];
            document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare submission data
            const submissionData = {
                title: formData.title,
                description: formData.shortDescription,
                content: formData.fullArticle,
                author: formData.authorName,
                category: formData.category,
                status: 'pending', // Pending admin review
                date: new Date().toISOString(),
                createdAt: serverTimestamp(),
                slug: generateSlug(formData.title)
            };

            let imageUrl = null;

            // Upload image if provided
            if (formData.mediaFile) {
                const storageRef = ref(storage, `submissions/${Date.now()}_${formData.mediaFile.name}`);

                const uploadTask = uploadBytesResumable(storageRef, formData.mediaFile);

                await new Promise((resolve, reject) => {
                    uploadTask.on(
                        'state_changed',
                        (snapshot) => {
                            // Track upload progress if desired
                            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                            console.log(`Upload is ${progress}% done`);
                        },
                        (error) => {
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

                submissionData.imageUrl = imageUrl;
            }

            // Add to "submissions" collection
            await addDoc(collection(db, "submissions"), submissionData);

            // Show success message
            setSubmitSuccess(true);

            // Reset form
            setFormData({
                title: '',
                shortDescription: '',
                fullArticle: '',
                authorName: '',
                category: 'news',
                mediaFile: null
            });
            setPreviewUrl(null);

            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error("Error submitting article:", error);
            setFormErrors({
                ...formErrors,
                submit: "There was a problem submitting your article. Please try again."
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Character count display
    const getCharacterCount = (text, minRequired = 0) => {
        const count = text.length;
        if (minRequired > 0) {
            return `${count}/${minRequired}+ characters`;
        }
        return `${count} characters`;
    };

    return (
        <div className="py-8">
            <motion.h1
                className="text-4xl font-bold mb-4 text-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                Submit Your Article
            </motion.h1>

            <motion.p
                className="text-lg text-center mb-12 max-w-2xl mx-auto text-black/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
            >
                Share your voice with the university community. All submissions are reviewed by our editorial team before publication.
            </motion.p>

            {/* Success message */}
            <AnimatePresence>
                {submitSuccess && (
                    <motion.div
                        className="max-w-3xl mx-auto mb-10"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-6 flex items-start">
                            <CheckCircle className="mr-3 h-6 w-6 flex-shrink-0 text-green-600" />
                            <div>
                                <h3 className="text-xl font-bold mb-2">Article Submitted Successfully</h3>
                                <p>Thank you for your submission! Our editorial team will review your article within 48-72 hours.</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Information Accordions */}
            <motion.div
                className="mb-12 max-w-3xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                {/* Submission Guidelines */}
                <div className="border-b border-black/10 pb-2">
                    <button
                        className="w-full flex justify-between items-center py-4 text-xl font-bold group"
                        onClick={() => handleToggleSection('guidelines')}
                    >
                        <span className="group-hover:text-black/80 transition-colors">Submission Guidelines</span>
                        {expanded.guidelines ?
                            <ChevronUpIcon size={20} className="text-black/70" /> :
                            <ChevronDownIcon size={20} className="text-black/70" />
                        }
                    </button>

                    <AnimatePresence>
                        {expanded.guidelines && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="py-4 px-2 text-black/80">
                                    <ul className="list-disc pl-5 space-y-3">
                                        <li>Articles should be between 300-1500 words.</li>
                                        <li>Keep language respectful and appropriate for all audiences.</li>
                                        <li>Original content only - plagiarism is strictly prohibited.</li>
                                        <li>Include sources for any factual claims or statistics.</li>
                                        <li>Images should be high-quality and either original or properly licensed.</li>
                                        <li>Opinion pieces should be clearly labeled as such.</li>
                                    </ul>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Submission Process */}
                <div className="border-b border-black/10 pb-2">
                    <button
                        className="w-full flex justify-between items-center py-4 text-xl font-bold group"
                        onClick={() => handleToggleSection('process')}
                    >
                        <span className="group-hover:text-black/80 transition-colors">Review Process</span>
                        {expanded.process ?
                            <ChevronUpIcon size={20} className="text-black/70" /> :
                            <ChevronDownIcon size={20} className="text-black/70" />
                        }
                    </button>

                    <AnimatePresence>
                        {expanded.process && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                            >
                                <div className="py-4 px-2 text-black/80">
                                    <ol className="list-decimal pl-5 space-y-3">
                                        <li>Submit your article using the form below.</li>
                                        <li>Our editorial team reviews submissions within 48-72 hours.</li>
                                        <li>You may be contacted for edits or clarifications.</li>
                                        <li>Once approved, your article will be published on The Echo.</li>
                                        <li>Published articles cannot be removed but can be updated upon request.</li>
                                    </ol>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Submission Form */}
            <motion.form
                ref={formRef}
                onSubmit={handleSubmit}
                className="max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
            >
                {/* General error message */}
                {formErrors.submit && (
                    <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
                        {formErrors.submit}
                    </div>
                )}

                <div className="mb-8">
                    <label htmlFor="title" className="block text-lg font-bold mb-2">
                        Article Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border ${formErrors.title ? 'border-red-400' : 'border-black/20'} focus:border-black transition-colors duration-200 outline-none`}
                        placeholder="Enter a compelling title"
                    />
                    <div className="mt-1 flex justify-between">
                        {formErrors.title ? (
                            <p className="text-red-600 text-sm">{formErrors.title}</p>
                        ) : (
                            <p className="text-xs text-black/50">Be clear, specific, and engaging</p>
                        )}
                        <p className="text-xs text-black/50">{getCharacterCount(formData.title, 5)}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label htmlFor="category" className="block text-lg font-bold mb-2">
                        Category <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-black/20 focus:border-black transition-colors duration-200 outline-none appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22black%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-no-repeat bg-[position:right_16px_center] pr-12"
                    >
                        <option value="news">News</option>
                        <option value="ae">Arts & Entertainment</option>
                        <option value="forum">Forum</option>
                        <option value="sports">Sports</option>
                    </select>
                    <p className="text-xs text-black/50 mt-1">Select the most appropriate section for your article</p>
                </div>

                <div className="mb-8">
                    <label htmlFor="shortDescription" className="block text-lg font-bold mb-2">
                        Short Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="shortDescription"
                        name="shortDescription"
                        value={formData.shortDescription}
                        onChange={handleInputChange}
                        rows="3"
                        className={`w-full px-4 py-3 border ${formErrors.shortDescription ? 'border-red-400' : 'border-black/20'} focus:border-black transition-colors duration-200 outline-none`}
                        placeholder="Provide a brief summary of your article"
                    ></textarea>
                    <div className="mt-1 flex justify-between">
                        {formErrors.shortDescription ? (
                            <p className="text-red-600 text-sm">{formErrors.shortDescription}</p>
                        ) : (
                            <p className="text-xs text-black/50">This will appear in article previews</p>
                        )}
                        <p className="text-xs text-black/50">{getCharacterCount(formData.shortDescription, 50)}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label htmlFor="fullArticle" className="block text-lg font-bold mb-2">
                        Full Article <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="fullArticle"
                        name="fullArticle"
                        value={formData.fullArticle}
                        onChange={handleInputChange}
                        rows="12"
                        className={`w-full px-4 py-3 border ${formErrors.fullArticle ? 'border-red-400' : 'border-black/20'} focus:border-black transition-colors duration-200 outline-none`}
                        placeholder="Write your complete article here"
                    ></textarea>
                    <div className="mt-1 flex justify-between">
                        {formErrors.fullArticle ? (
                            <p className="text-red-600 text-sm">{formErrors.fullArticle}</p>
                        ) : (
                            <p className="text-xs text-black/50">Minimum 300 characters, aim for 500-1500 words</p>
                        )}
                        <p className="text-xs text-black/50">{getCharacterCount(formData.fullArticle, 300)}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <label htmlFor="authorName" className="block text-lg font-bold mb-2">
                        Your Name
                    </label>
                    <input
                        type="text"
                        id="authorName"
                        name="authorName"
                        value={formData.authorName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-black/20 focus:border-black transition-colors duration-200 outline-none"
                        placeholder="Enter your name"
                    />
                    <p className="text-xs text-black/50 mt-1">Leave blank to publish as &quot;Anonymous&quot;</p>
                </div>

                <div className="mb-10">
                    <label className="block text-lg font-bold mb-2">
                        Featured Image (optional)
                    </label>

                    {!previewUrl ? (
                        <div
                            className={`border-2 border-dashed ${isDragging ? 'border-black/50 bg-black/5' : 'border-black/20'} rounded-md p-8 text-center cursor-pointer transition-colors duration-200`}
                            onClick={() => fileInputRef.current?.click()}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                id="mediaFile"
                                name="mediaFile"
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <UploadIcon size={32} className="mx-auto mb-4 text-black/60" />
                            <p className="mb-1 text-black/80">Drag and drop an image here or click to browse</p>
                            <p className="text-xs text-black/50">JPG, PNG or GIF, recommended size 1200×800px</p>

                            {formErrors.mediaFile && (
                                <p className="mt-3 text-red-600 text-sm">{formErrors.mediaFile}</p>
                            )}
                        </div>
                    ) : (
                        <div className="relative rounded-md overflow-hidden border border-black/10">
                            <div className="relative h-[240px] w-full">
                                <Image
                                    src={previewUrl}
                                    alt="Image preview"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <div className="p-3 bg-black/5">
                                <p className="text-sm truncate">{formData.mediaFile?.name}</p>
                                <p className="text-xs text-black/50">{Math.round((formData.mediaFile?.size || 0) / 1024)} KB</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="text-center mb-12">
                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-black text-white px-10 py-3 text-lg font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                                Submitting...
                            </span>
                        ) : 'Submit Article'}
                    </motion.button>
                </div>

                <div className="text-center text-sm text-black/50 italic">
                    By submitting, you agree to our community guidelines and editorial standards.
                </div>
            </motion.form>
        </div>
    );
}
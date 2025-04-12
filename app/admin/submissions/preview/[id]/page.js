'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, deleteDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../../../lib/firebase';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { extractStorageFileName } from '../../../../../lib/utils';


export default function SubmissionPreviewPage({ params }) {
    // Unwrap params with React.use()
    const unwrappedParams = React.use(params);
    const { id } = unwrappedParams;

    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        async function fetchSubmission() {
            try {
                const submissionDoc = await getDoc(doc(db, "submissions", id));

                if (submissionDoc.exists()) {
                    setSubmission({ id: submissionDoc.id, ...submissionDoc.data() });
                } else {
                    setError("Submission not found");
                }
            } catch (err) {
                console.error("Error fetching submission:", err);
                setError("Failed to load submission");
            } finally {
                setLoading(false);
            }
        }

        fetchSubmission();
    }, [id]);

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return "No date";
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format content as HTML
    const formatContent = (content) => {
        if (!content) return "";

        // Simple paragraph formatting
        return content
            .split('\n\n')
            .filter(p => p.trim())
            .map(p => `<p>${p}</p>`)
            .join('');
    };

    // Handle approving the submission
    const handleApprove = async () => {
        if (processing || !submission) return;

        try {
            setProcessing(true);

            // Generate a slug if one doesn't exist
            const slug = submission.slug || submission.title
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim()
                .substring(0, 80);

            // Convert to article
            const articleData = {
                title: submission.title,
                description: submission.shortDescription || submission.description,
                content: submission.content || submission.fullArticle,
                author: submission.author || "Anonymous",
                category: submission.category || "news",
                date: new Date().toISOString(),
                imageUrl: submission.imageUrl || '',
                slug: slug,
                status: 'published',
                createdAt: serverTimestamp()
            };

            // Add to articles collection
            await addDoc(collection(db, "articles"), articleData);

            // Delete from submissions 
            await deleteDoc(doc(db, "submissions", id));

            // Redirect back to submissions list
            router.push('/admin/submissions');

        } catch (err) {
            console.error("Error approving submission:", err);
            setError("Failed to approve submission");
        } finally {
            setProcessing(false);
        }
    };

    // Handle rejecting the submission
    const handleReject = async () => {
        if (processing || !submission) return;

        if (!confirm("Are you sure you want to reject this submission? This action cannot be undone.")) {
            return;
        }

        try {
            setProcessing(true);

            // Delete image file from storage if it exists
            if (submission.imageUrl) {
                try {
                    // Use the utility function to extract the filename
                    const fileName = extractStorageFileName(submission.imageUrl);

                    if (fileName) {
                        const fileRef = ref(storage, `submissions/${fileName}`);
                        console.log('Deleting file:', fileName);
                        await deleteObject(fileRef);
                        console.log('File deleted successfully');
                    } else {
                        console.warn('Could not extract filename from URL:', submission.imageUrl);
                    }
                } catch (fileError) {
                    console.error("Error deleting image file:", fileError);
                    // Continue with submission deletion even if file deletion fails
                }
            }

            // Delete from submissions collection
            await deleteDoc(doc(db, "submissions", id));

            // Redirect back to submissions list
            router.push('/admin/submissions');

        } catch (err) {
            console.error("Error rejecting submission:", err);
            setError("Failed to reject submission");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="py-16 flex justify-center">
                <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !submission) {
        return (
            <div className="py-16 text-center">
                <h2 className="text-xl font-bold mb-4">{error || "Submission not found"}</h2>
                <Link href="/admin/submissions" className="text-black underline">
                    Back to submissions
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-6">
            {/* Preview banner */}
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md mb-6 flex items-center justify-between">
                <span className="font-medium">Submission Preview</span>
                <span className="text-sm">Status: Pending Review</span>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-8">
                <Link href="/admin/submissions" className="inline-flex items-center text-sm text-black/70 hover:text-black">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to submissions
                </Link>

                <div className="flex space-x-2">
                    <button
                        onClick={handleApprove}
                        disabled={processing}
                        className="px-4 py-2 bg-green-600 text-black rounded-md hover:bg-green-700 text-sm flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="mr-1.5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Check size={16} className="mr-1.5" />
                                Approve
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={processing}
                        className="px-4 py-2 bg-red-500 text-black rounded-md hover:bg-red-600 text-sm flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {processing ? (
                            <>
                                <Loader2 size={16} className="mr-1.5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <X size={16} className="mr-1.5" />
                                Reject
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Display error if one occurs during processing */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
                    {error}
                </div>
            )}

            <article className="bg-white rounded-lg shadow-sm border border-black/10 p-8">
                {/* Category */}
                <div className="mb-3">
                    <span className="text-xs font-bold tracking-widest uppercase text-black/70">
                        {submission.category}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                    {submission.title}
                </h1>

                {/* Description/Summary */}
                <p className="text-xl text-black/70 mb-6">
                    {submission.shortDescription || submission.description}
                </p>

                {/* Author and date */}
                <div className="flex items-center mb-8 text-sm text-black/60">
                    <span>By <span className="font-medium">{submission.author || "Anonymous"}</span></span>
                    <span className="mx-2">•</span>
                    <time>{formatDate(submission.date)}</time>
                </div>

                {/* Featured image */}
                {submission.imageUrl && (
                    <div className="relative w-full h-[300px] md:h-[400px] mb-8 overflow-hidden rounded">
                        <Image
                            src={submission.imageUrl}
                            alt={submission.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {/* Article content */}
                <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatContent(submission.content || submission.fullArticle) }}
                />
            </article>
        </div>
    );
}
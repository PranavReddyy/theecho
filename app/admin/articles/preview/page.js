'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArticlePreviewPage() {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Load preview data from session storage
    useEffect(() => {
        // This only runs in the browser
        const previewData = sessionStorage.getItem('articlePreview');

        if (!previewData) {
            // No preview data available, redirect back to articles
            router.push('/admin/articles');
            return;
        }

        try {
            const parsedData = JSON.parse(previewData);
            setArticle(parsedData);
        } catch (error) {
            console.error('Failed to parse preview data:', error);
        } finally {
            setLoading(false);
        }
    }, [router]);

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Not specified';

        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="py-32 flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-2 border-black/20 border-t-black rounded-full animate-spin mb-4"></div>
                <p className="text-black/70 italic">Loading preview...</p>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">No preview data available</h2>
                <Link href="/admin/articles" className="text-black underline">
                    Return to Articles
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Preview banner */}
            <div className="bg-amber-100 text-amber-800 p-3 rounded-md mb-6 flex items-center justify-between">
                <span className="font-medium">Preview Mode</span>
                <span className="text-sm">Status: {article.status || 'Draft'}</span>
            </div>

            {/* Back button */}
            <button
                onClick={() => window.close()}
                className="inline-flex items-center text-sm mb-8 text-black/70 hover:text-black"
            >
                <ArrowLeft size={16} className="mr-1" />
                Close Preview
            </button>

            <article className="bg-white rounded-lg border border-black/10 p-8 shadow-sm">
                {/* Category */}
                <div className="mb-3">
                    <span className="text-xs font-bold tracking-widest uppercase text-black/70">
                        {article.category === 'ae' ? 'Arts & Entertainment' :
                            article.category === 'news' ? 'News' :
                                article.category === 'sports' ? 'Sports' :
                                    article.category === 'forum' ? 'Forum' : article.category}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                    {article.title}
                </h1>

                {/* Description */}
                <p className="text-xl text-black/70 mb-6">
                    {article.description}
                </p>

                {/* Author and date */}
                <div className="flex items-center mb-8 text-sm text-black/60">
                    <span>By <span className="font-medium">{article.author || 'Anonymous'}</span></span>
                    <span className="mx-2">•</span>
                    <time>{formatDate(article.date)}</time>
                </div>

                {/* Featured image */}
                {article.previewUrl && (
                    <div className="relative w-full h-[300px] md:h-[400px] mb-8 overflow-hidden rounded-md">
                        <Image
                            src={article.previewUrl}
                            alt={article.title}
                            fill
                            className="object-cover"
                        />
                    </div>
                )}

                {/* Article content */}
                <div
                    className="prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                {/* Slug display for reference */}
                <div className="mt-10 pt-6 border-t border-black/10">
                    <h3 className="text-sm font-medium text-black/70 mb-2">URL Preview</h3>
                    <code className="bg-black/5 py-1 px-2 rounded text-sm">
                        {`/${article.category}/${article.slug}`}
                    </code>
                </div>
            </article>
        </div>
    );
}
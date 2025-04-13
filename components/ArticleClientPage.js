'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ArticleClientPage({ category, slug }) {
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scrollProgress, setScrollProgress] = useState(0);


    // IMPORTANT: Map URL category to database category (lowercase)
    const categoryMap = {
        'news': 'news',
        'forum': 'forum',
        'sports': 'sports',
        'ae': 'ae'
    };

    // Get current database category
    const dbCategory = categoryMap[category] || 'news';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const progress = (scrollTop / docHeight) * 100;
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        async function fetchArticle() {
            try {
                console.log(`Fetching article with slug: ${slug}, category: ${dbCategory}`);

                // Create a cache timestamp that changes once per day
                const today = new Date();
                const cacheDate = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
                console.log(`Using cache date: ${cacheDate}`);

                // Query article by slug and category
                const articlesRef = collection(db, "articles");
                const q = query(
                    articlesRef,
                    where("slug", "==", slug),
                    where("category", "==", dbCategory),
                    limit(1)
                );

                const querySnapshot = await getDocs(q);
                console.log(`Query returned ${querySnapshot.size} results`);

                if (!querySnapshot.empty) {
                    const doc = querySnapshot.docs[0];
                    const articleData = doc.data();
                    // Add cache date to help with debugging
                    articleData._cacheDate = cacheDate;
                    setArticle({ id: doc.id, ...articleData });
                } else {
                    console.log("No article found with these parameters");
                    setError("Article not found");
                }
            } catch (err) {
                console.error("Error fetching article:", err);
                setError("Failed to load article");
            } finally {
                setLoading(false);
            }
        }

        fetchArticle();
    }, [slug, dbCategory]);

    // Display pretty category name
    const getCategoryDisplay = (cat) => {
        const categoryDisplayMap = {
            'news': 'News',
            'ae': 'Arts & Entertainment',
            'forum': 'Forum',
            'sports': 'Sports'
        };
        return categoryDisplayMap[cat] || cat;
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return "";

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
                <p className="text-black/70 italic">Loading article...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="py-16 flex flex-col items-center">
                <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
                <p className="text-black/70 mb-6">{error || "This article may have been removed or the URL is incorrect."}</p>
                <Link href={`/${category}`} className="text-black underline">
                    Return to {getCategoryDisplay(category)} section
                </Link>
            </div>
        );
    }

    return (
        <article className="py-10 max-w-3xl mx-auto">
            {/* Progress bar (NYT style) */}
            <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
                <motion.div
                    className="h-full bg-black"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>
            {/* Back button */}
            <Link href={`/${category}`} className="inline-flex items-center text-sm mb-8 text-black/70 hover:text-black">
                <ArrowLeft size={16} className="mr-1" />
                Back to {getCategoryDisplay(category)}
            </Link>

            {/* Category */}
            <motion.div
                className="mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            >
                <span className="text-xs font-bold tracking-widest uppercase text-black/70">
                    {getCategoryDisplay(article.category)}
                </span>
            </motion.div>

            {/* Title */}
            <motion.h1
                className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {article.title}
            </motion.h1>

            {/* Description */}
            <motion.p
                className="text-xl text-black/70 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
            >
                {article.description}
            </motion.p>

            {/* Author and date */}
            <motion.div
                className="flex items-center mb-8 text-sm text-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <span>By <span className="font-medium">{article.author}</span></span>
                <span className="mx-2">•</span>
                <time>{formatDate(article.date)}</time>
            </motion.div>

            {/* Featured image */}
            {article.imageUrl && (
                <motion.div
                    className="relative w-full h-[300px] md:h-[400px] lg:h-[500px] mb-8 overflow-hidden"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </motion.div>
            )}

            {/* Article content */}
            <motion.div
                className="prose prose-lg max-w-none leading-relaxed" // Added leading-relaxed
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                dangerouslySetInnerHTML={{ __html: formatContentToHtml(article.content) }}
            />
        </article>
    );
}

function formatContentToHtml(content) {
    if (!content) return '';

    console.log("Original content:", content);

    // Step 1: Create a simple, bulletproof conversion
    // This first converts all double+ newlines to a special marker
    let html = content.replace(/\n{2,}/g, '___PARAGRAPH___');

    // Step 2: Convert all remaining single newlines to <br> tags
    html = html.replace(/\n/g, '<br>\n'); // Add an actual newline after <br> for source readability

    // Step 3: Convert paragraph markers back to proper paragraph tags
    html = html.split('___PARAGRAPH___')
        .map(p => p.trim())
        .filter(p => p)
        .map(p => `<p>${p}</p>`)
        .join('\n\n'); // Add newlines between paragraphs for source readability

    console.log("Converted HTML:", html);

    return html;
}
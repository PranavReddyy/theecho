'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ArticleCard from '../components/ArticleCard';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

export default function CategoryClientPage({ category }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState(null);
    const headerRef = useRef(null);

    // Scroll progress indicator
    const [scrollProgress, setScrollProgress] = useState(0);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    // IMPORTANT: Correct category mapping
    const categoryMap = {
        'news': { display: 'News', dbCategory: 'news' },
        'forum': { display: 'Forum', dbCategory: 'forum' },
        'sports': { display: 'Sports', dbCategory: 'sports' },
        'ae': { display: 'Arts & Entertainment', dbCategory: 'ae' }
    };

    const currentCategory = categoryMap[category] || { display: 'News', dbCategory: 'news' };

    // Fetch articles from Firestore - use the same function structure
    useEffect(() => {
        async function loadArticles() {
            try {
                console.log(`Fetching articles for category: ${currentCategory.dbCategory}`);

                // Create a cache timestamp that changes once per day
                const today = new Date();
                const cacheDate = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
                console.log(`Using cache date: ${cacheDate}`);

                const articlesRef = collection(db, "articles");
                const articlesQuery = query(
                    articlesRef,
                    where("category", "==", currentCategory.dbCategory),
                    where("status", "==", "published"),
                    orderBy("date", "desc")
                    // No limit - show all articles
                );

                const querySnapshot = await getDocs(articlesQuery);
                const fetchedArticles = [];

                console.log(`Found ${querySnapshot.size} articles`);

                querySnapshot.forEach((doc) => {
                    fetchedArticles.push({
                        id: doc.id,
                        ...doc.data(),
                        _cacheDate: cacheDate // Add cache date for debugging
                    });
                });

                setArticles(fetchedArticles);
            } catch (err) {
                console.error("Error loading articles:", err);
                setError("Failed to load articles");
            } finally {
                setIsLoaded(true);
            }
        }

        loadArticles();
    }, [currentCategory.dbCategory]);

    // Handle scroll for progress bar
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

    // Simulate loading delay - same as news page
    useEffect(() => {
        setTimeout(() => setIsLoaded(true), 500);
    }, []);

    // Format date for article
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (!isLoaded) {
        return (
            <div className="py-32 flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-2 border-black/20 border-t-black rounded-full animate-spin mb-4"></div>
                <p className="text-black/70 italic">Loading stories...</p>
            </div>
        );
    }

    if (error || articles.length === 0) {
        return (
            <div className="py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">
                    {error || "No articles available at this time"}
                </h2>
                <p className="text-black/70">Please check back later for updates.</p>
            </div>
        );
    }

    const featuredArticle = articles[0];
    const remainingArticles = articles.slice(1);

    return (
        <div className="py-8 relative">
            {/* Progress bar (NYT style) */}
            <div className="fixed top-0 left-0 w-full h-1 bg-transparent z-50">
                <motion.div
                    className="h-full bg-black"
                    style={{ width: `${scrollProgress}%` }}
                />
            </div>

            {/* Page Header - Minimal NYT-style */}
            <div className="mb-10 border-b border-black/10 pb-4" ref={headerRef}>
                <motion.h1
                    className="text-xl font-bold mb-1 uppercase tracking-wide"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {currentCategory.display}
                </motion.h1>
                <motion.div
                    className="text-sm text-black/70 italic"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    Today&apos;s top campus stories
                </motion.div>
            </div>

            {/* Main content */}
            <div className="space-y-16">
                {/* Featured Article - EXACT MATCH with news page */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="border-b border-black/10 pb-12"
                >
                    <ArticleCard article={featuredArticle} featured={true} />
                </motion.div>

                {/* Grid of Article Cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    {remainingArticles.map((article) => (
                        <motion.div
                            key={article.id}
                            variants={itemVariants}
                            className="border border-black/5 hover:border-black/20 transition-colors duration-300"
                            whileHover={{ y: -3 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Link href={`/${category}/${article.slug}`} className="block h-full">
                                <div className="group h-full flex flex-col">
                                    {/* Image */}
                                    <div className="relative h-[180px] overflow-hidden">
                                        <motion.div
                                            className="w-full h-full"
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <Image
                                                src={article.imageUrl}
                                                alt={article.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </motion.div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col p-5 flex-grow">
                                        {/* Category */}
                                        <span className="inline-block text-xs font-bold tracking-widest uppercase mb-2 text-black/70">
                                            {article.category}
                                        </span>

                                        {/* Title */}
                                        <h2 className="text-xl font-bold mb-3 leading-tight">
                                            <span className="bg-left-bottom bg-gradient-to-r from-black to-black bg-[length:0%_1px] bg-no-repeat group-hover:bg-[length:100%_1px] transition-all duration-500">
                                                {article.title}
                                            </span>
                                        </h2>

                                        {/* Description */}
                                        <p className="text-sm text-black/80 mb-4 flex-grow">
                                            {article.description.length > 120
                                                ? `${article.description.substring(0, 120)}...`
                                                : article.description}
                                        </p>

                                        {/* Author and Date */}
                                        <div className="flex items-center justify-between text-xs text-black/60 pt-3 border-t border-black/10 mt-auto">
                                            <span className="font-medium">{article.author}</span>
                                            <time>{formatDate(article.date)}</time>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </motion.div>

                {/* "End of Articles" indicator */}
                <motion.div
                    className="mt-16 flex justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                >
                    <div className="text-center">
                        <div className="inline-block w-4 h-4 bg-black/5 rounded-full mb-2"></div>
                        <p className="text-xs text-black/50 uppercase tracking-widest">End of Section</p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
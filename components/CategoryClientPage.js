'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, limit, startAfter } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ArticleCard from '../components/ArticleCard';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function CategoryClientPage({ category }) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [featuredArticle, setFeaturedArticle] = useState(null);
    const [articles, setArticles] = useState([]);
    const [error, setError] = useState(null);
    const headerRef = useRef(null);
    const observerRef = useRef(null);
    const lastDocRef = useRef(null);

    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const ARTICLES_PER_PAGE = 6; // 2 rows x 3 columns

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

    // 1. Function to load featured article separately
    const loadFeaturedArticle = useCallback(async () => {
        try {
            const articlesRef = collection(db, "articles");
            const featuredQuery = query(
                articlesRef,
                where("category", "==", currentCategory.dbCategory),
                where("status", "==", "published"),
                orderBy("date", "desc"),
                limit(1)
            );

            const snapshot = await getDocs(featuredQuery);

            if (!snapshot.empty) {
                const featured = {
                    id: snapshot.docs[0].id,
                    ...snapshot.docs[0].data()
                };
                setFeaturedArticle(featured);
            }
        } catch (err) {
            console.error("Error loading featured article:", err);
            setError("Failed to load articles");
        }
    }, [currentCategory.dbCategory]);

    // 2. Function to load paginated articles
    const loadArticles = useCallback(async (isFirstLoad = false) => {
        try {
            if (isFirstLoad) {
                setIsLoadingMore(true);
            }

            const articlesRef = collection(db, "articles");
            let articlesQuery;

            if (isFirstLoad || !lastDocRef.current) {
                // First page query - skip first article (featured)
                articlesQuery = query(
                    articlesRef,
                    where("category", "==", currentCategory.dbCategory),
                    where("status", "==", "published"),
                    orderBy("date", "desc"),
                    limit(ARTICLES_PER_PAGE + 1) // +1 to account for featured article
                );
            } else {
                // Subsequent pages - use startAfter with last document
                articlesQuery = query(
                    articlesRef,
                    where("category", "==", currentCategory.dbCategory),
                    where("status", "==", "published"),
                    orderBy("date", "desc"),
                    startAfter(lastDocRef.current),
                    limit(ARTICLES_PER_PAGE)
                );
            }

            const querySnapshot = await getDocs(articlesQuery);

            if (querySnapshot.empty) {
                setHasMore(false);
                return;
            }

            // Update last document reference for pagination
            lastDocRef.current = querySnapshot.docs[querySnapshot.docs.length - 1];

            const fetchedArticles = [];
            querySnapshot.forEach((doc) => {
                fetchedArticles.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            // On first load, remove the featured article from the list
            if (isFirstLoad && fetchedArticles.length > 0) {
                const remainingArticles = fetchedArticles.slice(1);
                setArticles(remainingArticles);

                // If we got fewer than requested, there are no more
                setHasMore(fetchedArticles.length > ARTICLES_PER_PAGE);
            } else {
                setArticles(prev => [...prev, ...fetchedArticles]);
                // Check if we got full page
                setHasMore(fetchedArticles.length === ARTICLES_PER_PAGE);
            }
        } catch (err) {
            console.error("Error loading articles:", err);
            setError("Failed to load articles");
        } finally {
            setIsLoadingMore(false);
            if (isFirstLoad) {
                setIsLoaded(true);
            }
        }
    }, [currentCategory.dbCategory]);

    // 3. Initial load - featured article and first page
    useEffect(() => {
        setIsLoaded(false);
        setArticles([]);
        setFeaturedArticle(null);
        lastDocRef.current = null;
        setHasMore(true);

        // First load the featured article
        loadFeaturedArticle().then(() => {
            // Then load the first page of articles
            loadArticles(true);
        });
    }, [currentCategory.dbCategory, loadFeaturedArticle, loadArticles]);

    // 4. Intersection Observer for infinite scroll
    useEffect(() => {
        // Create intersection observer
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    loadArticles(false);
                }
            },
            { threshold: 0.5 }
        );

        const currentObserver = observerRef.current;

        // Observe the target element
        if (currentObserver) {
            observer.observe(currentObserver);
        }

        return () => {
            if (currentObserver) {
                observer.unobserve(currentObserver);
            }
        };
    }, [hasMore, isLoadingMore, loadArticles]);

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

    if (error || (!featuredArticle && articles.length === 0)) {
        return (
            <div className="py-16 text-center">
                <h2 className="text-2xl font-bold mb-4">
                    {error || "No articles available at this time"}
                </h2>
                <p className="text-black/70">Please check back later for updates.</p>
            </div>
        );
    }

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
                {/* Featured Article */}
                {featuredArticle && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8 }}
                        className="border-b border-black/10 pb-12"
                    >
                        <ArticleCard article={featuredArticle} featured={true} />
                    </motion.div>
                )}

                {/* Grid of Article Cards - With AnimatePresence for new items */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <AnimatePresence>
                        {articles.map((article) => (
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
                                                    loading="lazy"
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
                    </AnimatePresence>
                </motion.div>

                {/* Loading or End of Articles indicator */}
                <div className="mt-8 flex justify-center" ref={observerRef}>
                    {isLoadingMore ? (
                        <motion.div
                            className="flex flex-col items-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Loader2 className="w-6 h-6 text-black/40 animate-spin mb-2" />
                            <p className="text-sm text-black/60">Loading more articles...</p>
                        </motion.div>
                    ) : hasMore ? (
                        <motion.button
                            className="px-8 py-3 border border-black/10 hover:border-black/30 text-sm font-medium transition-colors duration-200"
                            onClick={() => loadArticles(false)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Load more articles
                        </motion.button>
                    ) : (
                        <motion.div
                            className="text-center"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="inline-block w-4 h-4 bg-black/5 rounded-full mb-2"></div>
                            <p className="text-xs text-black/50 uppercase tracking-widest">End of Section</p>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
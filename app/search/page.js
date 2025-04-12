'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion'; // For micro-animations

export default function SearchPage() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function performSearch() {
            if (!searchQuery.trim()) {
                setResults([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);

                // Create search terms by lowercasing the query and splitting into words
                const searchTerms = searchQuery.toLowerCase().split(/\s+/).filter(term => term.length > 0);

                // Get all published articles
                const articlesRef = collection(db, "articles");
                const articlesQuery = query(
                    articlesRef,
                    where("status", "==", "published"),
                    orderBy("date", "desc")
                );

                const querySnapshot = await getDocs(articlesQuery);
                const allArticles = [];

                querySnapshot.forEach((doc) => {
                    allArticles.push({ id: doc.id, ...doc.data() });
                });

                // Filter articles that match search terms in title, description, or content
                const matchedArticles = allArticles.filter(article => {
                    const titleLower = (article.title || '').toLowerCase();
                    const descriptionLower = (article.description || '').toLowerCase();
                    const contentLower = (article.content || '').toLowerCase();
                    const authorLower = (article.author || '').toLowerCase();

                    // Check if any search term appears in any of the text fields
                    return searchTerms.some(term =>
                        titleLower.includes(term) ||
                        descriptionLower.includes(term) ||
                        contentLower.includes(term) ||
                        authorLower.includes(term)
                    );
                });

                setResults(matchedArticles);
            } catch (err) {
                console.error("Search error:", err);
                setError("An error occurred while searching. Please try again.");
            } finally {
                setLoading(false);
            }
        }

        performSearch();
    }, [searchQuery]);

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
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="py-10 max-w-3xl mx-auto px-4">
            {/* Back button */}
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Link href="/" className="inline-flex items-center text-sm mb-8 text-black/70 hover:text-black">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to home
                </Link>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className="text-3xl font-bold mb-6">Search Results</h1>

                <div className="mb-8">
                    <p className="text-lg">
                        {searchQuery ? (
                            <>
                                Showing results for: <span className="font-medium">&quot;{searchQuery}&quot;</span>
                            </>
                        ) : (
                            'Please enter a search term'
                        )}
                    </p>
                    {!loading && searchQuery && (
                        <p className="text-sm text-black/70 mt-1">
                            {results.length} {results.length === 1 ? 'result' : 'results'} found
                        </p>
                    )}
                </div>
            </motion.div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-10 h-10 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : error ? (
                <motion.div
                    className="text-center py-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                >
                    <p className="text-red-600">{error}</p>
                </motion.div>
            ) : results.length === 0 && searchQuery ? (
                <motion.div
                    className="text-center py-10 border-t border-black/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <p className="text-lg">No articles found matching your search.</p>
                    <p className="text-sm text-black/70 mt-2">Try different keywords or browse our categories.</p>
                </motion.div>
            ) : (
                <motion.div
                    className="divide-y divide-black/10"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <AnimatePresence>
                        {results.map((article) => (
                            <motion.article
                                key={article.id}
                                className="py-6 first:pt-2"
                                variants={itemVariants}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <Link
                                    href={`/${article.category}/${article.slug}`}
                                    className="group block"
                                >
                                    <div className="flex gap-4">
                                        {article.imageUrl && (
                                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded">
                                                <Image
                                                    src={article.imageUrl}
                                                    alt={article.title}
                                                    fill
                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <h2 className="text-lg font-bold mb-1 group-hover:text-black/80 transition-colors">
                                                {article.title}
                                            </h2>
                                            <p className="text-sm text-black/70 mb-2 line-clamp-2">
                                                {article.description}
                                            </p>
                                            <div className="flex items-center text-xs text-black/60">
                                                <span className="font-medium uppercase mr-2">
                                                    {article.category === 'ae' ? 'A&E' :
                                                        article.category.charAt(0).toUpperCase() + article.category.slice(1)}
                                                </span>
                                                <span>•</span>
                                                <span className="mx-2">{article.author}</span>
                                                <span>•</span>
                                                <span className="ml-2">
                                                    {new Date(article.date).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
}
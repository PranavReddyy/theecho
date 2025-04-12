'use client';
// Add these imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    collection, query, orderBy, where, getDocs, doc, deleteDoc, getDoc
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase';
import { extractStorageFileName } from '../../../lib/utils';
import {
    FileText, Edit, Eye, Trash2, Search, Filter, ChevronUp, ChevronDown,
    X, AlertTriangle
} from 'lucide-react';

export default function ArticlesPage() {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Fetch articles from Firebase
    useEffect(() => {
        async function fetchArticles() {
            try {
                setLoading(true);
                const articlesRef = collection(db, "articles");

                // Build query based on filters
                let articlesQuery = query(articlesRef);

                if (filterCategory !== 'all') {
                    articlesQuery = query(articlesRef, where("category", "==", filterCategory));
                }

                articlesQuery = query(articlesQuery, orderBy(sortField, sortDirection));

                const querySnapshot = await getDocs(articlesQuery);
                let results = [];

                querySnapshot.forEach((doc) => {
                    results.push({ id: doc.id, ...doc.data() });
                });

                // Handle search term filtering client-side
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    results = results.filter(article =>
                        article.title.toLowerCase().includes(term) ||
                        article.description.toLowerCase().includes(term) ||
                        article.author.toLowerCase().includes(term)
                    );
                }

                setArticles(results);
            } catch (err) {
                console.error("Error fetching articles:", err);
                setError("Failed to load articles");
            } finally {
                setLoading(false);
            }
        }

        fetchArticles();
    }, [sortField, sortDirection, filterCategory, searchTerm]);

    // Handle sort toggle
    const handleSort = (field) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Handle article deletion
    const handleDelete = async (id) => {
        if (isDeleting) return;

        if (!confirm("Are you sure you want to delete this article? This action cannot be undone.")) {
            return;
        }

        try {
            setIsDeleting(true);
            setDeleteId(id);

            // First get the article to check if it has an image
            const articleRef = doc(db, "articles", id);
            const articleSnap = await getDoc(articleRef);

            if (articleSnap.exists()) {
                const articleData = articleSnap.data();

                // Delete image from storage if it exists
                if (articleData.imageUrl) {
                    try {
                        const fileName = extractStorageFileName(articleData.imageUrl);

                        if (fileName) {
                            const fileRef = ref(storage, `articles/${fileName}`);
                            await deleteObject(fileRef);
                            console.log('Article image deleted from storage');
                        } else {
                            console.warn('Could not extract filename from URL:', articleData.imageUrl);
                        }
                    } catch (fileError) {
                        console.error("Error deleting image:", fileError);
                        // Continue with document deletion even if image deletion fails
                    }
                }
            }

            // Delete the document from Firestore
            await deleteDoc(doc(db, "articles", id));

            // Remove from state
            setArticles(articles.filter(article => article.id !== id));

        } catch (err) {
            console.error("Error deleting article:", err);
            setError("Failed to delete article");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return "No date";
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Render articles list UI with search, filters, and article items
    return (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-serif font-bold">All Articles</h1>
                <Link
                    href="/admin/articles/new"
                    className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-black/80 transition-colors"
                >
                    New Article
                </Link>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-black/20 focus:border-black outline-none transition-colors"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black/40 hover:text-black"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-black/20 focus:border-black outline-none transition-colors"
                >
                    <option value="all">All Categories</option>
                    <option value="news">News</option>
                    <option value="ae">A&E</option>
                    <option value="forum">Forum</option>
                    <option value="sports">Sports</option>
                </select>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start">
                    <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Articles list */}
            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : articles.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-lg text-black/70">No articles found</p>
                    {(searchTerm || filterCategory !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterCategory('all');
                            }}
                            className="mt-4 text-sm underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-md shadow-sm border border-black/5 overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-4 p-4 bg-black/5 text-sm font-medium">
                        <div className="col-span-6">
                            <button
                                onClick={() => handleSort('title')}
                                className="flex items-center hover:text-black/80"
                            >
                                Title
                                {sortField === 'title' && (
                                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                )}
                            </button>
                        </div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-2">
                            <button
                                onClick={() => handleSort('date')}
                                className="flex items-center hover:text-black/80"
                            >
                                Date
                                {sortField === 'date' && (
                                    sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                                )}
                            </button>
                        </div>
                        <div className="col-span-2 text-right">Actions</div>
                    </div>

                    {/* Table body */}
                    <div className="divide-y divide-black/5">
                        {articles.map((article) => (
                            <motion.div
                                key={article.id}
                                className="grid grid-cols-12 gap-4 p-4 items-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="col-span-6 flex items-center">
                                    {article.imageUrl ? (
                                        <div className="w-10 h-10 relative rounded overflow-hidden mr-3 flex-shrink-0">
                                            <Image
                                                src={article.imageUrl}
                                                alt={article.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 bg-gray-100 rounded mr-3 flex items-center justify-center flex-shrink-0">
                                            <FileText size={16} className="text-gray-400" />
                                        </div>
                                    )}
                                    <div className="truncate">
                                        {article.title}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${article.status === 'published' ? 'bg-green-100 text-green-800' :
                                        article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {article.status}
                                    </span>
                                </div>
                                <div className="col-span-2 text-sm text-black/70">
                                    {formatDate(article.date)}
                                </div>
                                <div className="col-span-2 flex justify-end space-x-1">
                                    <Link
                                        href={`/admin/articles/edit/${article.id}`}
                                        className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit size={16} />
                                    </Link>
                                    <Link
                                        href={`/${article.category.toLowerCase()}/${article.slug}`}
                                        className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                                        target="_blank"
                                        title="View"
                                    >
                                        <Eye size={16} />
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(article.id)}
                                        disabled={isDeleting && deleteId === article.id}
                                        className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                        title="Delete"
                                    >
                                        {isDeleting && deleteId === article.id ? (
                                            <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
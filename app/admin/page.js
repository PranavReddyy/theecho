'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    FileText,
    Edit,
    Eye,
    Calendar,
    Users,
    Plus,
    Clock,
    Toggle,
    Save
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

// Dashboard card component
const DashboardCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
        className="bg-white p-6 rounded-md shadow-sm border border-black/5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-black/60 text-xs uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold mt-1">{value}</h3>
            </div>

            <div className={`p-3 rounded-full ${color}`}>
                <Icon size={20} className="text-white" />
            </div>
        </div>
    </motion.div>
);

// Recent articles component
const RecentArticles = ({ articles }) => (
    <motion.div
        className="bg-white rounded-md shadow-sm border border-black/5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
    >
        <div className="px-6 py-4 border-b border-black/10 flex justify-between items-center">
            <h3 className="font-medium">Recent Articles</h3>
            <Link
                href="/admin/articles/new"
                className="bg-black text-white text-xs px-3 py-1.5 rounded-md flex items-center hover:bg-black/80 transition-colors"
            >
                <Plus size={14} className="mr-1" />
                New Article
            </Link>
        </div>

        {articles.length === 0 ? (
            <div className="p-6 text-center text-black/60">
                <p>No articles yet</p>
                <Link
                    href="/admin/articles/new"
                    className="text-sm text-black/70 hover:text-black mt-2 inline-block"
                >
                    Create your first article
                </Link>
            </div>
        ) : (
            <>
                <div className="divide-y divide-black/5">
                    {articles.map((article, index) => (
                        <motion.div
                            key={article.id}
                            className="p-4 flex items-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 + (index * 0.05) }}
                        >
                            {article.imageUrl ? (
                                <div className="w-12 h-12 relative rounded-md overflow-hidden mr-4 flex-shrink-0">
                                    <Image
                                        src={article.imageUrl}
                                        alt={article.title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-md mr-4 flex items-center justify-center flex-shrink-0">
                                    <FileText size={20} className="text-gray-400" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{article.title}</p>
                                <div className="flex items-center mt-1">
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full mr-2 ${article.status === 'published' ? 'bg-green-100 text-green-800' :
                                        article.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {article.status}
                                    </span>
                                    <span className="text-xs text-black/60">
                                        {new Date(article.date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex space-x-2 ml-2">
                                <Link
                                    href={`/admin/articles/edit/${article.id}`}
                                    className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                                >
                                    <Edit size={16} />
                                </Link>
                                <Link
                                    href={`/${article.category.toLowerCase()}/${article.slug}`}
                                    className="p-1.5 rounded-md hover:bg-black/5 transition-colors"
                                    target="_blank"
                                >
                                    <Eye size={16} />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
                <div className="px-6 py-3 bg-black/5">
                    <Link href="/admin/articles" className="text-xs text-black/70 hover:text-black transition-colors">
                        View all articles →
                    </Link>
                </div>
            </>
        )}
    </motion.div>
);

export default function AdminDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState([]);
    const [articles, setArticles] = useState([]);

    // New state for countdown settings
    const [countdownSettings, setCountdownSettings] = useState({
        enabled: true,
        targetDate: new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000), // Default to 3 days from now
        title: "Next Issue"
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', message: '' });

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch article count
                const articlesRef = collection(db, "articles");
                const articlesSnapshot = await getDocs(articlesRef);
                const articleCount = articlesSnapshot.size;

                // Fetch upcoming events count
                const eventsRef = collection(db, "events");
                const upcomingEventsQuery = query(
                    eventsRef,
                    where("status", "==", "upcoming")
                );
                const eventsSnapshot = await getDocs(upcomingEventsQuery);
                const upcomingEventsCount = eventsSnapshot.size;

                // Fetch submissions count
                const submissionsRef = collection(db, "submissions");
                const submissionsSnapshot = await getDocs(submissionsRef);
                const submissionsCount = submissionsSnapshot.size;

                // Fetch countdown settings
                const countdownDocRef = doc(db, "settings", "countdown");
                const countdownDoc = await getDoc(countdownDocRef);

                if (countdownDoc.exists()) {
                    const data = countdownDoc.data();
                    setCountdownSettings({
                        enabled: data.enabled,
                        targetDate: data.targetDate.toDate(),
                        title: data.title || "Next Issue"
                    });
                }

                // Set stats with actual data
                setStats([
                    {
                        title: "Total Articles",
                        value: articleCount.toString(),
                        icon: FileText,
                        color: "bg-blue-500"
                    },
                    {
                        title: "Upcoming Events",
                        value: upcomingEventsCount.toString(),
                        icon: Calendar,
                        color: "bg-amber-500"
                    },
                    {
                        title: "User Submissions",
                        value: submissionsCount.toString(),
                        icon: Users,
                        color: "bg-purple-500"
                    }
                ]);

                // Fetch recent articles for the list
                const recentArticlesQuery = query(
                    articlesRef,
                    orderBy("date", "desc"),
                    limit(5)
                );
                const recentArticlesSnapshot = await getDocs(recentArticlesQuery);
                const recentArticles = [];

                recentArticlesSnapshot.forEach(doc => {
                    recentArticles.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                setArticles(recentArticles);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                // Still set empty arrays if there's an error to show proper empty states
                setStats([
                    { title: "Total Articles", value: "0", icon: FileText, color: "bg-blue-500" },
                    { title: "Upcoming Events", value: "0", icon: Calendar, color: "bg-amber-500" },
                    { title: "User Submissions", value: "0", icon: Users, color: "bg-purple-500" }
                ]);
                setArticles([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, []);

    const formatDateTimeForInput = (date) => {
        if (!date || !(date instanceof Date) || isNaN(date)) {
            return '';
        }

        // Format to YYYY-MM-DDThh:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Function to save countdown settings
    const saveCountdownSettings = async () => {
        setIsSaving(true);
        setSaveMessage({ type: '', message: '' });

        try {
            const countdownDocRef = doc(db, "settings", "countdown");
            await setDoc(countdownDocRef, {
                enabled: countdownSettings.enabled,
                targetDate: Timestamp.fromDate(new Date(countdownSettings.targetDate)),
                title: countdownSettings.title,
                updatedAt: Timestamp.now()
            });

            setSaveMessage({
                type: 'success',
                message: 'Countdown settings saved successfully!'
            });

            // Auto-clear success message after 3 seconds
            setTimeout(() => {
                setSaveMessage({ type: '', message: '' });
            }, 3000);
        } catch (error) {
            console.error("Error saving countdown settings:", error);
            setSaveMessage({
                type: 'error',
                message: 'Failed to save settings. Please try again.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full py-20">
                <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-serif font-bold">Dashboard</h1>
                <p className="text-sm text-black/60">
                    {new Date().toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>
            </div>

            {/* Stats Cards - Real data only */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <DashboardCard
                        key={stat.title}
                        title={stat.title}
                        value={stat.value}
                        icon={stat.icon}
                        color={stat.color}
                    />
                ))}
            </div>

            {/* Recent Articles - Real data only */}
            <RecentArticles articles={articles} />
            <motion.div
                className="bg-white rounded-md shadow-sm border border-black/5 overflow-hidden mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <div className="px-6 py-4 border-b border-black/10 flex justify-between items-center">
                    <h3 className="font-medium">Countdown Settings</h3>
                    <div className="flex items-center">
                        <Clock size={16} className="text-black/60 mr-2" />
                        <span className="text-sm text-black/60">Controls the countdown timer in the navbar</span>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-black/5">
                        <div>
                            <label className="font-medium text-sm">Enable Countdown</label>
                            <p className="text-xs text-black/60 mt-1">Show or hide the countdown timer on the website</p>
                        </div>
                        <button
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${countdownSettings.enabled ? 'bg-black' : 'bg-gray-200'}`}
                            onClick={() => setCountdownSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${countdownSettings.enabled ? 'translate-x-6' : 'translate-x-1'}`}
                            />
                        </button>
                    </div>

                    <div className="pb-4 border-b border-black/5">
                        <label className="font-medium text-sm">Countdown Title</label>
                        <p className="text-xs text-black/60 mt-1">Label shown above the countdown</p>
                        <input
                            type="text"
                            value={countdownSettings.title}
                            onChange={(e) => setCountdownSettings(prev => ({ ...prev, title: e.target.value }))}
                            className="mt-2 block w-full max-w-xs rounded-md border border-black/10 px-3 py-2 text-sm focus:border-black focus:outline-none"
                            placeholder="Next Issue"
                        />
                    </div>

                    <div>
                        <label className="font-medium text-sm">Target Date & Time</label>
                        <p className="text-xs text-black/60 mt-1">When the countdown will end</p>
                        <input
                            type="datetime-local"
                            value={formatDateTimeForInput(countdownSettings.targetDate)}
                            onChange={(e) => {
                                if (e.target.value) {
                                    const date = new Date(e.target.value);
                                    setCountdownSettings(prev => ({ ...prev, targetDate: date }));
                                }
                            }}
                            className="mt-2 block w-full max-w-xs rounded-md border border-black/10 px-3 py-2 text-sm focus:border-black focus:outline-none"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <div>
                            {saveMessage.type === 'success' && (
                                <p className="text-sm text-green-600">{saveMessage.message}</p>
                            )}
                            {saveMessage.type === 'error' && (
                                <p className="text-sm text-red-600">{saveMessage.message}</p>
                            )}
                        </div>
                        <button
                            onClick={saveCountdownSettings}
                            disabled={isSaving}
                            className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-black/80 transition-colors disabled:bg-black/50"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="mr-2" />
                                    Save Settings
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
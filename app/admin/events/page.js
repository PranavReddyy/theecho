'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    collection, query, orderBy, getDocs, doc, deleteDoc, where
} from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import {
    Calendar, Edit, Eye, Trash2, Search, Filter, ChevronUp, ChevronDown,
    X, AlertTriangle, Plus, Clock, MapPin
} from 'lucide-react';

export default function AdminEventsPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Fetch events from Firebase
    useEffect(() => {
        async function fetchEvents() {
            try {
                setLoading(true);
                const eventsRef = collection(db, "events");

                // Build query based on filters
                let eventsQuery = query(eventsRef);

                if (filterStatus !== 'all') {
                    eventsQuery = query(eventsRef, where("status", "==", filterStatus));
                }

                eventsQuery = query(eventsQuery, orderBy(sortField, sortDirection));

                const querySnapshot = await getDocs(eventsQuery);
                let results = [];

                querySnapshot.forEach((doc) => {
                    results.push({ id: doc.id, ...doc.data() });
                });

                // Handle search term filtering client-side
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    results = results.filter(event =>
                        event.title.toLowerCase().includes(term) ||
                        event.description.toLowerCase().includes(term) ||
                        event.location.toLowerCase().includes(term) ||
                        event.organizer.toLowerCase().includes(term)
                    );
                }

                // Group events by date
                const groupedEvents = groupEventsByDate(results);
                setEvents(groupedEvents);
            } catch (err) {
                console.error("Error fetching events:", err);
                setError("Failed to load events");
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, [sortField, sortDirection, filterStatus, searchTerm]);

    // Group events by date for display
    const groupEventsByDate = (eventsList) => {
        const groups = {};

        eventsList.forEach(event => {
            // For multi-day events, use the start date for grouping
            const dateKey = event.date.includes('to')
                ? event.date.split(' to ')[0]
                : event.date;

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }

            groups[dateKey].push(event);
        });

        // Convert to array and sort by date
        return Object.keys(groups)
            .sort((a, b) => {
                if (sortDirection === 'desc') {
                    return new Date(b) - new Date(a);
                }
                return new Date(a) - new Date(b);
            })
            .map(date => ({
                date,
                events: groups[date]
            }));
    };

    // Handle sort toggle
    const handleSort = (field) => {
        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Handle event deletion
    const handleDelete = async (id) => {
        if (isDeleting) return;

        if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
            return;
        }

        try {
            setIsDeleting(true);
            setDeleteId(id);

            await deleteDoc(doc(db, "events", id));

            // Update UI
            setEvents(prevGroups => {
                const newGroups = [...prevGroups];

                // Find and remove the event from its group
                for (let i = 0; i < newGroups.length; i++) {
                    const group = newGroups[i];
                    const eventIndex = group.events.findIndex(e => e.id === id);

                    if (eventIndex !== -1) {
                        group.events.splice(eventIndex, 1);

                        // If the group is now empty, remove it
                        if (group.events.length === 0) {
                            newGroups.splice(i, 1);
                        }

                        break;
                    }
                }

                return newGroups;
            });

        } catch (err) {
            console.error("Error deleting event:", err);
            setError("Failed to delete event");
        } finally {
            setIsDeleting(false);
            setDeleteId(null);
        }
    };

    // Format date for display
    const formatDate = (dateStr) => {
        if (!dateStr) return "No date";

        if (dateStr.includes('to')) {
            const [start, end] = dateStr.split(' to ');
            const startDate = new Date(start);
            const endDate = new Date(end);

            // Format dates
            const startFormatted = startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            const endFormatted = endDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `${startFormatted} - ${endFormatted}`;
        }

        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Calculate status for display (upcoming, ongoing, completed)
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'upcoming':
                return { name: 'Upcoming', className: 'bg-blue-100 text-blue-800' };
            case 'ongoing':
                return { name: 'Happening Now', className: 'bg-amber-100 text-amber-800' };
            case 'completed':
                return { name: 'Past Event', className: 'bg-gray-100 text-gray-600' };
            default:
                return { name: status, className: 'bg-gray-100 text-gray-800' };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with actions */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-serif font-bold">Campus Events</h1>
                <Link
                    href="/admin/events/new"
                    className="bg-black text-white px-4 py-2 rounded-md text-sm hover:bg-black/80 transition-colors"
                >
                    <span className="flex items-center">
                        <Plus size={16} className="mr-1" />
                        Add Event
                    </span>
                </Link>
            </div>

            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow">
                    <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black/40" />
                    <input
                        type="text"
                        placeholder="Search events..."
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
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-black/20 focus:border-black outline-none transition-colors"
                >
                    <option value="all">All Statuses</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Past</option>
                </select>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md flex items-start">
                    <AlertTriangle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {/* Events list */}
            {loading ? (
                <div className="py-12 flex justify-center">
                    <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : events.length === 0 ? (
                <div className="py-12 text-center">
                    <p className="text-lg text-black/70">No events found</p>
                    {(searchTerm || filterStatus !== 'all') && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterStatus('all');
                            }}
                            className="mt-4 text-sm underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-8">
                    {events.map((dateGroup) => (
                        <div key={dateGroup.date} className="bg-white rounded-md shadow-sm border border-black/5 overflow-hidden">
                            {/* Date header */}
                            <div className="px-6 py-3 bg-black/5 font-medium text-sm">
                                <div className="flex items-center">
                                    <Calendar size={16} className="mr-2 text-black/60" />
                                    <span>{formatDate(dateGroup.date)}</span>
                                </div>
                            </div>

                            {/* Events for this date */}
                            <div className="divide-y divide-black/5">
                                {dateGroup.events.map((event) => (
                                    <motion.div
                                        key={event.id}
                                        className="p-4 sm:p-6"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                            <div className="flex-grow">
                                                {/* Event status */}
                                                <div className="mb-2">
                                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusDisplay(event.status).className}`}>
                                                        {getStatusDisplay(event.status).name}
                                                        {event.featured && ' • Featured'}
                                                    </span>
                                                </div>

                                                {/* Event title */}
                                                <h3 className="text-lg font-bold mb-1">{event.title}</h3>

                                                {/* Event details */}
                                                <div className="text-sm text-black/70 mb-3">
                                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                        <div className="flex items-center">
                                                            <Clock size={14} className="mr-1 flex-shrink-0" />
                                                            <span>{event.time}</span>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <MapPin size={14} className="mr-1 flex-shrink-0" />
                                                            <span>{event.location}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Multi-day indicator */}
                                                {event.date && event.date.includes('to') && (
                                                    <div className="mt-1 mb-2">
                                                        <span className="text-xs bg-black/5 py-1 px-2 rounded">
                                                            Multi-day event
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Truncated description */}
                                                <p className="text-sm text-black/80 line-clamp-2">
                                                    {event.description}
                                                </p>

                                                {/* Sub-events indicator */}
                                                {event.subEvents && event.subEvents.length > 0 && (
                                                    <div className="mt-2 text-xs text-black/60">
                                                        {event.subEvents.length} related {event.subEvents.length === 1 ? 'event' : 'events'}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex mt-3 md:mt-0 md:ml-4 space-x-2">
                                                <Link
                                                    href={`/admin/events/edit/${event.id}`}
                                                    className="p-2 rounded-md hover:bg-black/5 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </Link>
                                                <Link
                                                    href={`/events#event-${event.id}`}
                                                    className="p-2 rounded-md hover:bg-black/5 transition-colors"
                                                    target="_blank"
                                                    title="View"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    disabled={isDeleting && deleteId === event.id}
                                                    className="p-2 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    {isDeleting && deleteId === event.id ? (
                                                        <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
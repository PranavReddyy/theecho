'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Calendar, MapPin, Clock, Users, ChevronDown, ChevronRight } from 'lucide-react';

export default function EventsPage() {
    const [eventGroups, setEventGroups] = useState([]);
    const [featuredEvents, setFeaturedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedEventIds, setExpandedEventIds] = useState({});
    const headerRef = useRef(null);

    // Fetch events from Firestore
    useEffect(() => {
        async function fetchEvents() {
            try {
                const eventsRef = collection(db, "events");
                const q = query(eventsRef, orderBy("date", "desc")); // Latest first
                const querySnapshot = await getDocs(q);

                const allEvents = [];
                const featured = [];

                querySnapshot.forEach((doc) => {
                    const eventData = { id: doc.id, ...doc.data() };
                    allEvents.push(eventData);

                    if (eventData.featured) {
                        featured.push(eventData);
                    }
                });

                // Group events by month and year
                const grouped = groupEventsByMonthYear(allEvents);
                setEventGroups(grouped);
                setFeaturedEvents(featured);
            } catch (err) {
                console.error("Error fetching events:", err);
                setError("Unable to load events. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    // Group events by month and year for a cleaner timeline
    const groupEventsByMonthYear = (eventsList) => {
        const groups = {};

        eventsList.forEach(event => {
            let dateKey;

            if (event.date.includes('to')) {
                // For multi-day events, use the start date for grouping
                dateKey = event.date.split(' to ')[0];
            } else {
                dateKey = event.date;
            }

            // Convert to Date object and extract month/year
            const date = new Date(dateKey);
            const monthYearKey = `${date.getFullYear()}-${date.getMonth()}`;

            if (!groups[monthYearKey]) {
                groups[monthYearKey] = {
                    monthYear: new Date(date.getFullYear(), date.getMonth(), 1),
                    events: []
                };
            }

            groups[monthYearKey].events.push(event);
        });

        // Convert to array and sort by date (newest first)
        return Object.values(groups)
            .sort((a, b) => b.monthYear - a.monthYear)
            .map(group => ({
                ...group,
                // Sort events within month by date (newest first)
                events: group.events.sort((a, b) => {
                    const dateA = new Date(a.date.includes('to') ? a.date.split(' to ')[0] : a.date);
                    const dateB = new Date(b.date.includes('to') ? b.date.split(' to ')[0] : b.date);
                    return dateB - dateA;
                })
            }));
    };

    // Toggle expanded state for event details
    const toggleEventDetails = (eventId) => {
        setExpandedEventIds(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
    };

    // Format date for display - elegant formatting
    const formatDate = (dateStr) => {
        if (!dateStr) return "";

        if (dateStr.includes('to')) {
            const [start, end] = dateStr.split(' to ');
            const startDate = new Date(start);
            const endDate = new Date(end);

            return `${startDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric'
            })} – ${endDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric'
            })}`;
        }

        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric'
        });
    };

    // Format month-year for timeline headers
    const formatMonthYear = (date) => {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="py-32 flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-2 border-black/10 border-t-black rounded-full animate-spin mb-4"></div>
                <p className="text-black/60 font-serif">Loading events...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="py-16 text-center">
                <h2 className="text-2xl font-serif mb-4">Something went wrong</h2>
                <p className="text-black/60">{error}</p>
            </div>
        );
    }

    return (
        <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
            {/* Page Header */}
            <div className="mb-16" ref={headerRef}>
                <motion.h1
                    className="text-3xl md:text-4xl font-bold mb-4 text-center tracking-tight"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                    Campus Events
                </motion.h1>
                <motion.div
                    className="text-lg text-black/60 text-center max-w-2xl mx-auto mb-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    Connecting our community through shared experiences.
                </motion.div>
            </div>

            {/* Featured Events */}
            {featuredEvents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mb-20"
                >
                    <h2 className="text-2xl font-bold mb-8 text-center">Featured</h2>

                    <div className="space-y-12">
                        {featuredEvents.map((event, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.1 * index }}
                                key={event.id}
                                id={`event-${event.id}`}
                                className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-300"
                            >
                                <div className="flex items-center mb-3">
                                    <span className="bg-black/5 text-black/80 px-3 py-1 rounded-full text-sm font-medium">
                                        {formatDate(event.date)}
                                    </span>
                                    {event.date.includes('to') && (
                                        <span className="ml-2 bg-black/5 text-black/70 px-3 py-1 rounded-full text-sm">
                                            Multi-day
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-2xl font-serif mb-3 group-hover:text-black transition-colors">
                                    {event.title}
                                </h3>

                                <div className="flex flex-wrap gap-4 mb-5 text-sm text-black/60">
                                    <div className="flex items-center">
                                        <Clock size={15} className="mr-1.5" />
                                        <span>{event.time}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin size={15} className="mr-1.5" />
                                        <span>{event.location}</span>
                                    </div>
                                    {event.organizer && (
                                        <div className="flex items-center">
                                            <Users size={15} className="mr-1.5" />
                                            <span>{event.organizer}</span>
                                        </div>
                                    )}
                                </div>

                                <p className="mb-6 text-black/70 leading-relaxed">{event.description}</p>

                                {event.subEvents && event.subEvents.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-black/10">
                                        <button
                                            onClick={() => toggleEventDetails(event.id)}
                                            className="flex items-center text-sm font-medium text-black/60 hover:text-black transition-colors"
                                        >
                                            {expandedEventIds[event.id] ? (
                                                <ChevronDown size={16} className="mr-1.5 transition-transform" />
                                            ) : (
                                                <ChevronRight size={16} className="mr-1.5 transition-transform" />
                                            )}
                                            {event.subEvents.length} Related {event.subEvents.length === 1 ? 'Session' : 'Sessions'}
                                        </button>

                                        <AnimatePresence>
                                            {expandedEventIds[event.id] && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                        {event.subEvents.map(subEvent => (
                                                            <div
                                                                key={subEvent.id}
                                                                className="p-3 bg-black/[0.02] hover:bg-black/[0.05] transition-colors rounded"
                                                            >
                                                                <h4 className="font-medium mb-2 text-black/90">
                                                                    {subEvent.title}
                                                                </h4>
                                                                <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs mb-2 text-black/60">
                                                                    {subEvent.date ? (
                                                                        <div className="flex items-center">
                                                                            <Calendar size={12} className="mr-1 text-black/40" />
                                                                            <span>{new Date(subEvent.date).toLocaleDateString('en-US', {
                                                                                month: 'short',
                                                                                day: 'numeric'
                                                                            })}</span>
                                                                        </div>
                                                                    ) : subEvent.day ? (
                                                                        <div className="flex items-center">
                                                                            <Calendar size={12} className="mr-1 text-black/40" />
                                                                            <span>Day {subEvent.day}</span>
                                                                        </div>
                                                                    ) : null}
                                                                    <div className="flex items-center">
                                                                        <Clock size={12} className="mr-1 text-black/40" />
                                                                        <span>{subEvent.time}</span>
                                                                    </div>
                                                                    <div className="flex items-center">
                                                                        <MapPin size={12} className="mr-1 text-black/40" />
                                                                        <span>{subEvent.location}</span>
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-black/70">
                                                                    {subEvent.description}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Timeline of Events */}
            <div className="space-y-16">
                {eventGroups.length === 0 ? (
                    <div className="text-center py-10">
                        <p className="text-lg text-black/60 font-serif italic">No events scheduled at this time.</p>
                    </div>
                ) : (
                    eventGroups.map((monthGroup, groupIndex) => (
                        <div key={groupIndex} className="relative">
                            <motion.h3
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 * groupIndex, duration: 0.5 }}
                                className="text-xl font-bold mb-6 text-center"
                            >
                                {formatMonthYear(monthGroup.monthYear)}
                            </motion.h3>

                            <div className="space-y-8">
                                {monthGroup.events
                                    .filter(event => !event.featured) // Exclude featured events
                                    .map((event, eventIndex) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 * eventIndex + 0.2, duration: 0.5 }}
                                            key={event.id}
                                            id={`event-${event.id}`}
                                            className="group relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-3 before:h-3 before:bg-black/10 before:rounded-full hover:before:bg-black/30 before:transition-colors"
                                        >
                                            <div className="mb-2">
                                                <span className="text-sm font-medium text-black/60 bg-black/[0.03] px-2 py-0.5 rounded">
                                                    {formatDate(event.date)}
                                                </span>
                                                {event.date.includes('to') && (
                                                    <span className="ml-2 text-xs text-black/50 bg-black/[0.02] px-2 py-0.5 rounded">
                                                        Multi-day
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-xl font-serif mb-2 group-hover:text-black transition-colors">
                                                {event.title}
                                            </h4>

                                            <div className="flex flex-wrap gap-3 mb-3 text-sm text-black/60">
                                                <div className="flex items-center">
                                                    <Clock size={14} className="mr-1.5 text-black/40" />
                                                    <span>{event.time}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin size={14} className="mr-1.5 text-black/40" />
                                                    <span>{event.location}</span>
                                                </div>
                                                {event.organizer && (
                                                    <div className="flex items-center">
                                                        <Users size={14} className="mr-1.5 text-black/40" />
                                                        <span>{event.organizer}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <p className="text-black/70 mb-4">{event.description}</p>

                                            {event.subEvents && event.subEvents.length > 0 && (
                                                <div>
                                                    <button
                                                        onClick={() => toggleEventDetails(event.id)}
                                                        className="flex items-center text-sm font-medium text-black/50 hover:text-black transition-colors"
                                                    >
                                                        {expandedEventIds[event.id] ? (
                                                            <ChevronDown size={14} className="mr-1.5 transition-transform" />
                                                        ) : (
                                                            <ChevronRight size={14} className="mr-1.5 transition-transform" />
                                                        )}
                                                        {event.subEvents.length} Related {event.subEvents.length === 1 ? 'Session' : 'Sessions'}
                                                    </button>

                                                    <AnimatePresence>
                                                        {expandedEventIds[event.id] && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="mt-4 pl-2 border-l border-black/10 space-y-3">
                                                                    {event.subEvents.map(subEvent => (
                                                                        <div
                                                                            key={subEvent.id}
                                                                            className="pl-2 py-2 border-l-2 border-transparent hover:border-black/10 transition-colors"
                                                                        >
                                                                            <h5 className="font-medium mb-1">
                                                                                {subEvent.title}
                                                                            </h5>
                                                                            <div className="flex flex-wrap gap-3 text-xs mb-2 text-black/60">
                                                                                {subEvent.date ? (
                                                                                    <div className="flex items-center">
                                                                                        <Calendar size={12} className="mr-1 text-black/40" />
                                                                                        <span>{new Date(subEvent.date).toLocaleDateString('en-US', {
                                                                                            month: 'short',
                                                                                            day: 'numeric'
                                                                                        })}</span>
                                                                                    </div>
                                                                                ) : subEvent.day ? (
                                                                                    <div className="flex items-center">
                                                                                        <Calendar size={12} className="mr-1 text-black/40" />
                                                                                        <span>Day {subEvent.day}</span>
                                                                                    </div>
                                                                                ) : null}
                                                                                <div className="flex items-center">
                                                                                    <Clock size={12} className="mr-1 text-black/40" />
                                                                                    <span>{subEvent.time}</span>
                                                                                </div>
                                                                                <div className="flex items-center">
                                                                                    <MapPin size={12} className="mr-1 text-black/40" />
                                                                                    <span>{subEvent.location}</span>
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-sm text-black/70">
                                                                                {subEvent.description}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
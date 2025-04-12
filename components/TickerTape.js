'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function TickerTape() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const tickerRef = useRef(null);
    const wrapperRef = useRef(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);

    // Fetch events from Firebase
    useEffect(() => {
        async function fetchEvents() {
            try {
                const eventsRef = collection(db, "events");
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

                // Query for all events
                const q = query(
                    eventsRef,
                    orderBy("date", "asc")
                );

                const querySnapshot = await getDocs(q);
                const eventsList = [];

                querySnapshot.forEach((doc) => {
                    const eventData = doc.data();
                    let dateStr = eventData.date;
                    let includeEvent = false;

                    // Check if event is current or future
                    if (dateStr.includes('to')) {
                        // Multi-day event
                        const [start, end] = dateStr.split(' to ');
                        const endDate = new Date(end);
                        includeEvent = endDate >= today;

                        // Format date for display
                        const startDate = new Date(start);
                        const formattedStart = startDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        });
                        const formattedEnd = endDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        });
                        dateStr = `${formattedStart}–${formattedEnd}`;
                    } else {
                        // Single day event
                        const eventDate = new Date(dateStr);
                        includeEvent = eventDate >= today;

                        // Format date for display
                        dateStr = eventDate.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                        });
                    }

                    if (includeEvent) {
                        eventsList.push({
                            id: doc.id,
                            title: eventData.title,
                            date: dateStr
                        });
                    }
                });

                // Take top 10 events
                setEvents(eventsList.slice(0, 10));
            } catch (error) {
                console.error("Error fetching events for ticker:", error);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        }

        fetchEvents();
    }, []);

    // Check if animation is needed (content wider than container)
    useEffect(() => {
        if (events.length > 0 && tickerRef.current && wrapperRef.current) {
            // Add small delay to ensure DOM is properly rendered
            const checkWidth = setTimeout(() => {
                const contentWidth = tickerRef.current.scrollWidth;
                const containerWidth = wrapperRef.current.offsetWidth;

                setShouldAnimate(contentWidth > containerWidth);

                if (contentWidth > containerWidth) {
                    // Create animation
                    const tickerStyle = document.createElement('style');
                    tickerStyle.type = 'text/css';

                    // Calculate duration based on content length (longer content = slower scroll)
                    const duration = Math.max(20, contentWidth / 50);

                    tickerStyle.innerHTML = `
                        @keyframes ticker-scroll {
                            0% { transform: translateX(0); }
                            100% { transform: translateX(-${contentWidth / 2}px); }
                        }
                        .animate-ticker {
                            animation: ticker-scroll ${duration}s linear infinite;
                        }
                    `;

                    document.head.appendChild(tickerStyle);

                    return () => {
                        if (document.head.contains(tickerStyle)) {
                            document.head.removeChild(tickerStyle);
                        }
                    };
                }
            }, 500);

            return () => clearTimeout(checkWidth);
        }
    }, [events]);

    // Don't render if no events or still loading
    if (loading || events.length === 0) {
        return null;
    }

    return (
        <div className="w-full py-2 border-b border-black/10">
            <div className="max-w-[1200px] mx-auto px-4">
                <div
                    ref={wrapperRef}
                    className="overflow-hidden whitespace-nowrap relative"
                >
                    <div className={`flex ${shouldAnimate ? "animate-ticker" : "justify-center"}`}>
                        <div
                            ref={tickerRef}
                            className="inline-flex items-center"
                        >
                            {events.map((event, index) => (
                                <Link
                                    key={`event-${event.id}`}
                                    href={`/events#event-${event.id}`}
                                    className="inline-flex items-center group mx-4 sm:mx-6 hover:text-black transition-colors"
                                >
                                    <span className="font-medium text-black/80 group-hover:text-black transition-colors">{event.title}</span>
                                    <span className="mx-2 text-black/30">•</span>
                                    <span className="text-black/60">{event.date}</span>
                                </Link>
                            ))}
                        </div>

                        {/* Only add duplicate content if we need to animate */}
                        {shouldAnimate && (
                            <div className="inline-flex items-center">
                                {events.map((event, index) => (
                                    <Link
                                        key={`event-dup-${event.id}`}
                                        href={`/events#event-${event.id}`}
                                        className="inline-flex items-center group mx-4 sm:mx-6 hover:text-black transition-colors"
                                    >
                                        <span className="font-medium text-black/80 group-hover:text-black transition-colors">{event.title}</span>
                                        <span className="mx-2 text-black/30">•</span>
                                        <span className="text-black/60">{event.date}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
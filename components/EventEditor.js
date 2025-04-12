'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import Link from 'next/link';
import { doc, collection, addDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function EventEditor({ eventId }) {
    const router = useRouter();
    const isEditMode = !!eventId;

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        date: '',
        endDate: '', // Only used for multi-day events
        time: '',
        location: '',
        description: '',
        organizer: '',
        featured: false,
        subEvents: []
    });

    // UI state
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [isMultiDay, setIsMultiDay] = useState(false);
    const [expandedSubEvents, setExpandedSubEvents] = useState({});
    const [dayCount, setDayCount] = useState(1);
    const [renderKey, setRenderKey] = useState(0);



    useEffect(() => {
        if (isMultiDay && formData.date && formData.endDate) {
            try {
                // Parse dates using UTC to avoid timezone issues
                const start = new Date(formData.date + 'T00:00:00Z');
                const end = new Date(formData.endDate + 'T00:00:00Z');

                // Validate dates
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    console.error("Invalid date values:", formData.date, formData.endDate);
                    setDayCount(1);
                    return;
                }

                // Calculate difference in days
                const diffTimeMs = end.getTime() - start.getTime();
                const diffDays = Math.floor(diffTimeMs / (1000 * 60 * 60 * 24)) + 1;

                console.log("🔄 Date calculation updated:", {
                    startDate: formData.date,
                    endDate: formData.endDate,
                    diffDays,
                    calculationTime: new Date().toISOString()
                });

                // Update day count
                const newDayCount = Math.max(1, diffDays);

                // Always force a re-render by incrementing render key
                setRenderKey(prev => prev + 1);
                setDayCount(newDayCount);

                // Check for out-of-range day values
                setFormData(prev => {
                    if (!prev.subEvents.some(se => se.day > newDayCount)) {
                        return prev; // No changes needed
                    }

                    console.log(`Adjusting out-of-range day values (max: ${newDayCount})`);

                    return {
                        ...prev,
                        subEvents: prev.subEvents.map(subEvent => {
                            if (subEvent.day > newDayCount) {
                                return { ...subEvent, day: 1 };
                            }
                            return subEvent;
                        })
                    };
                });
            } catch (error) {
                console.error("Error calculating days:", error);
                setDayCount(1);
            }
        } else {
            setDayCount(1);
        }
    }, [formData.date, formData.endDate, isMultiDay]);

    // Fetch event data if in edit mode
    useEffect(() => {
        async function fetchEvent() {
            if (!isEditMode) return;

            try {
                setLoading(true);
                const docRef = doc(db, "events", eventId);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    router.push('/admin/events');
                    return;
                }

                const eventData = docSnap.data();

                // Handle multi-day events
                if (eventData.date && eventData.date.includes('to')) {
                    const [startDate, endDate] = eventData.date.split(' to ');

                    setFormData({
                        ...eventData,
                        date: startDate,
                        endDate: endDate
                    });

                    setIsMultiDay(true);
                } else {
                    setFormData({
                        ...eventData,
                        endDate: '' // Ensure this is reset for single-day events
                    });
                }

                // Initialize expanded state for sub-events
                if (eventData.subEvents && eventData.subEvents.length > 0) {
                    const initialExpandedState = {};
                    eventData.subEvents.forEach((subEvent, index) => {
                        initialExpandedState[index] = false;
                    });
                    setExpandedSubEvents(initialExpandedState);
                }

            } catch (error) {
                console.error("Error fetching event:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchEvent();
    }, [eventId, isEditMode, router]);

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear errors for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Handle sub-event input changes
    const handleSubEventChange = (index, field, value) => {
        setFormData(prev => {
            const updatedSubEvents = [...prev.subEvents];
            updatedSubEvents[index] = {
                ...updatedSubEvents[index],
                [field]: field === 'day' ? Number(value) : value
            };
            return {
                ...prev,
                subEvents: updatedSubEvents
            };
        });
    };

    // Add a new sub-event
    const addSubEvent = () => {
        setFormData(prev => ({
            ...prev,
            subEvents: [
                ...prev.subEvents,
                {
                    id: `sub-${Date.now()}`, // Temporary ID
                    title: '',
                    time: '',
                    location: '',
                    description: '',
                    day: isMultiDay ? 1 : undefined // Only set day if multi-day event
                }
            ]
        }));

        // Auto-expand the new sub-event
        setExpandedSubEvents(prev => ({
            ...prev,
            [formData.subEvents.length]: true
        }));
    };

    // Remove a sub-event
    const removeSubEvent = (index) => {
        setFormData(prev => {
            const updatedSubEvents = [...prev.subEvents];
            updatedSubEvents.splice(index, 1);
            return {
                ...prev,
                subEvents: updatedSubEvents
            };
        });

        // Update expanded state
        setExpandedSubEvents(prev => {
            const newState = {};
            Object.keys(prev).forEach(key => {
                const keyNum = parseInt(key);
                if (keyNum < index) {
                    newState[keyNum] = prev[keyNum];
                } else if (keyNum > index) {
                    newState[keyNum - 1] = prev[keyNum];
                }
            });
            return newState;
        });
    };

    // Toggle expanded state for a sub-event
    const toggleSubEventExpanded = (index) => {
        setExpandedSubEvents(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    // Toggle multi-day event
    const toggleMultiDay = () => {
        const newIsMultiDay = !isMultiDay;
        setIsMultiDay(newIsMultiDay);
        setRenderKey(prev => prev + 1);

        // Auto-expand all sub-events when toggling to see changes
        if (formData.subEvents.length > 0) {
            const newExpandedState = {};
            formData.subEvents.forEach((_, idx) => {
                newExpandedState[idx] = true;
            });
            setExpandedSubEvents(newExpandedState);
        }

        if (newIsMultiDay) {
            // Set default end date to start date if empty
            setFormData(prev => ({
                ...prev,
                endDate: prev.endDate || prev.date,
                // Update sub-events to include day property if switching to multi-day
                subEvents: prev.subEvents.map(subEvent => ({
                    ...subEvent,
                    day: subEvent.day || 1 // Set default day to 1 if not already set
                }))
            }));
        } else {
            // Remove day property from sub-events if switching to single-day
            setFormData(prev => ({
                ...prev,
                endDate: '', // Clear end date
                subEvents: prev.subEvents.map(subEvent => {
                    const newSubEvent = { ...subEvent };
                    delete newSubEvent.day; // Remove day property
                    return newSubEvent;
                })
            }));
        }
    };

    // Validate the form
    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        }

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        if (isMultiDay && !formData.endDate) {
            newErrors.endDate = 'End date is required for multi-day events';
        }

        if (isMultiDay && new Date(formData.endDate) < new Date(formData.date)) {
            newErrors.endDate = 'End date must be after start date';
        }

        if (!formData.time) {
            newErrors.time = 'Time is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        if (!formData.organizer.trim()) {
            newErrors.organizer = 'Organizer is required';
        }

        // Validate sub-events
        const subEventErrors = {};
        formData.subEvents.forEach((subEvent, index) => {
            const errors = {};

            if (!subEvent.title.trim()) {
                errors.title = 'Title is required';
            }

            if (!subEvent.time) {
                errors.time = 'Time is required';
            }

            if (!subEvent.location.trim()) {
                errors.location = 'Location is required';
            }

            if (!subEvent.description.trim()) {
                errors.description = 'Description is required';
            }

            if (isMultiDay && (subEvent.day === undefined || subEvent.day === null || subEvent.day === '')) {
                errors.day = 'Day is required for multi-day events';
            }

            if (Object.keys(errors).length > 0) {
                subEventErrors[index] = errors;
            }
        });

        if (Object.keys(subEventErrors).length > 0) {
            newErrors.subEvents = subEventErrors;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // Scroll to first error
            const firstErrorField = document.querySelector('[aria-invalid="true"]');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setSaving(true);

        try {
            // Prepare event data
            const eventData = {
                ...formData,
                // Format date properly for multi-day events
                date: isMultiDay ? `${formData.date} to ${formData.endDate}` : formData.date,
                // Calculate initial status based on dates
                status: calculateEventStatus(formData.date, isMultiDay ? formData.endDate : null, formData.time),
                // Update timestamps
                updatedAt: serverTimestamp()
            };

            // Remove endDate from the final data since it's now part of the date string
            if (isMultiDay) {
                delete eventData.endDate;
            }

            // Format sub-events
            if (eventData.subEvents.length > 0) {
                eventData.subEvents = eventData.subEvents.map(subEvent => {
                    // Clean up any fields that shouldn't be present
                    const cleanSubEvent = { ...subEvent };

                    // Only include day for multi-day events, ensure it's a number
                    if (!isMultiDay && cleanSubEvent.day !== undefined) {
                        delete cleanSubEvent.day;
                    } else if (isMultiDay && cleanSubEvent.day !== undefined) {
                        cleanSubEvent.day = Number(cleanSubEvent.day);
                    }

                    return cleanSubEvent;
                });
            }

            // Save to Firestore
            if (isEditMode) {
                // Update existing event
                await updateDoc(doc(db, "events", eventId), eventData);
            } else {
                // Add new event
                eventData.createdAt = serverTimestamp();
                await addDoc(collection(db, "events"), eventData);
            }

            // Go back to events list
            router.push('/admin/events');

        } catch (error) {
            console.error("Error saving event:", error);
            setErrors(prev => ({
                ...prev,
                submit: "Failed to save event. Please try again."
            }));
        } finally {
            setSaving(false);
        }
    };

    // Calculate initial event status based on dates
    const calculateEventStatus = (startDate, endDate, timeStr) => {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

        const start = new Date(startDate);
        const end = endDate ? new Date(endDate) : start;

        // Set end of day
        end.setHours(23, 59, 59, 999);

        // If event is in the future
        if (start > now) {
            return 'upcoming';
        }

        // If event is in the past
        if (end < now) {
            return 'completed';
        }

        // If today is the event date, check the time
        if (startDate === today || (endDate && endDate === today)) {
            if (timeStr) {
                const [startTimeStr, endTimeStr] = timeStr.split(' - ');
                const [startHour, startMinute] = startTimeStr.split(':');
                const [endHour, endMinute] = endTimeStr.split(':');

                // Simple calculation - doesn't handle AM/PM
                // You can enhance this function with proper time parsing
                const eventStart = new Date();
                eventStart.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

                const eventEnd = new Date();
                eventEnd.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);

                if (now < eventStart) {
                    return 'upcoming';
                }

                if (now > eventEnd) {
                    return 'completed';
                }

                return 'ongoing';
            }
        }

        // Default: if dates are current but no time check
        return 'ongoing';
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Back button */}
            <div className="mb-6">
                <Link href="/admin/events" className="inline-flex items-center text-sm text-black/70 hover:text-black">
                    <ArrowLeft size={16} className="mr-1" />
                    Back to events
                </Link>
            </div>

            {/* Error message */}
            {errors.submit && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.submit}
                </div>
            )}

            {isMultiDay && formData.date && formData.endDate && (
                <div className="mb-4 px-3 py-2 bg-blue-50 text-sm text-blue-800 rounded-md">
                    <div className="flex items-center">
                        <span className="font-medium mr-1">Multi-day event:</span>
                        {formData.date} to {formData.endDate}
                        <span className="mx-2">•</span>
                        <span className="font-medium">{dayCount} days calculated</span>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white shadow-sm rounded-md border border-black/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/10">
                        <h2 className="text-lg font-medium">
                            {isEditMode ? 'Edit Event' : 'New Event'}
                        </h2>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Basic info section */}
                        <div className="space-y-4">
                            {/* Title */}
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-black/80 mb-1">
                                    Event Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border ${errors.title ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                    aria-invalid={errors.title ? "true" : "false"}
                                />
                                {errors.title && (
                                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                                )}
                            </div>

                            {/* Date fields */}
                            <div>
                                <label className="block text-sm font-medium text-black/80 mb-1">
                                    Date <span className="text-red-500">*</span>
                                </label>

                                <div className="flex items-center mb-2">
                                    <input
                                        type="checkbox"
                                        id="multiDay"
                                        checked={isMultiDay}
                                        onChange={toggleMultiDay}
                                        className="mr-2"
                                    />
                                    <label htmlFor="multiDay" className="text-sm">
                                        Multi-day event
                                    </label>
                                </div>

                                <div className={`flex gap-4 ${isMultiDay ? 'flex-col sm:flex-row' : ''}`}>
                                    <div className="flex-1">
                                        <label htmlFor="date" className="block text-xs text-black/60 mb-1">
                                            {isMultiDay ? 'Start Date' : 'Date'}
                                        </label>
                                        <input
                                            type="date"
                                            id="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            className={`w-full px-3 py-2 border ${errors.date ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                            aria-invalid={errors.date ? "true" : "false"}
                                        />
                                        {errors.date && (
                                            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                                        )}
                                    </div>

                                    {isMultiDay && (
                                        <div className="flex-1">
                                            <label htmlFor="endDate" className="block text-xs text-black/60 mb-1">
                                                End Date
                                            </label>
                                            <input
                                                type="date"
                                                id="endDate"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border ${errors.endDate ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                                aria-invalid={errors.endDate ? "true" : "false"}
                                            />
                                            {errors.endDate && (
                                                <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Time */}
                            <div>
                                <label htmlFor="time" className="block text-sm font-medium text-black/80 mb-1">
                                    Time <span className="text-red-500">*</span> <span className="text-xs font-normal text-black/60">(e.g., &quot;11:00 AM - 2:00 PM&quot;)</span>
                                </label>
                                <input
                                    type="text"
                                    id="time"
                                    name="time"
                                    value={formData.time}
                                    onChange={handleInputChange}
                                    placeholder="11:00 AM - 2:00 PM"
                                    className={`w-full px-3 py-2 border ${errors.time ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                    aria-invalid={errors.time ? "true" : "false"}
                                />
                                {errors.time && (
                                    <p className="mt-1 text-sm text-red-600">{errors.time}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-black/80 mb-1">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border ${errors.location ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                    aria-invalid={errors.location ? "true" : "false"}
                                />
                                {errors.location && (
                                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-black/80 mb-1">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={`w-full px-3 py-2 border ${errors.description ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                    aria-invalid={errors.description ? "true" : "false"}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            {/* Organizer */}
                            <div>
                                <label htmlFor="organizer" className="block text-sm font-medium text-black/80 mb-1">
                                    Organizer <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="organizer"
                                    name="organizer"
                                    value={formData.organizer}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border ${errors.organizer ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                    aria-invalid={errors.organizer ? "true" : "false"}
                                />
                                {errors.organizer && (
                                    <p className="mt-1 text-sm text-red-600">{errors.organizer}</p>
                                )}
                            </div>

                            {/* Featured event */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="featured"
                                    name="featured"
                                    checked={formData.featured}
                                    onChange={handleInputChange}
                                    className="mr-2"
                                />
                                <label htmlFor="featured" className="text-sm">
                                    Featured event (will be highlighted)
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-events section */}
                <div className="bg-white shadow-sm rounded-md border border-black/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-black/10 flex justify-between items-center">
                        <h2 className="text-lg font-medium">Related Events</h2>
                        <button
                            type="button"
                            onClick={addSubEvent}
                            className="text-sm bg-black text-white px-3 py-1.5 rounded flex items-center hover:bg-black/80 transition-colors"
                        >
                            <Plus size={14} className="mr-1" />
                            Add Related Event
                        </button>
                    </div>

                    <div className="p-6">
                        {formData.subEvents.length === 0 ? (
                            <p className="text-sm text-black/60 italic">No related events added yet. Use the button above to add related events like workshops, panels, or sessions that are part of this main event.</p>
                        ) : (
                            <div className="space-y-4">
                                {formData.subEvents.map((subEvent, index) => (
                                    <div key={index} className="border border-black/10 rounded-md overflow-hidden">
                                        <div className="bg-black/5 px-4 py-3 flex justify-between items-center">
                                            <div className="flex items-center">
                                                <span className="font-medium text-sm">
                                                    {subEvent.title || `Related Event ${index + 1}`}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSubEventExpanded(index)}
                                                    className="p-1 hover:bg-black/10 rounded-md mr-1"
                                                >
                                                    {expandedSubEvents[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubEvent(index)}
                                                    className="p-1 hover:bg-red-100 hover:text-red-600 rounded-md"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        {expandedSubEvents[index] && (
                                            <div className="p-4 space-y-4">
                                                {/* Sub-event title */}
                                                <div>
                                                    <label htmlFor={`subEvent-${index}-title`} className="block text-sm font-medium text-black/80 mb-1">
                                                        Title <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`subEvent-${index}-title`}
                                                        value={subEvent.title}
                                                        onChange={(e) => handleSubEventChange(index, 'title', e.target.value)}
                                                        className={`w-full px-3 py-2 border ${errors.subEvents?.[index]?.title ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                                        aria-invalid={errors.subEvents?.[index]?.title ? "true" : "false"}
                                                    />
                                                    {errors.subEvents?.[index]?.title && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.subEvents[index].title}</p>
                                                    )}
                                                </div>

                                                {/* Sub-event time */}
                                                <div>
                                                    <label htmlFor={`subEvent-${index}-time`} className="block text-sm font-medium text-black/80 mb-1">
                                                        Time <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`subEvent-${index}-time`}
                                                        value={subEvent.time}
                                                        onChange={(e) => handleSubEventChange(index, 'time', e.target.value)}
                                                        placeholder="11:00 AM - 12:30 PM"
                                                        className={`w-full px-3 py-2 border ${errors.subEvents?.[index]?.time ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                                        aria-invalid={errors.subEvents?.[index]?.time ? "true" : "false"}
                                                    />
                                                    {errors.subEvents?.[index]?.time && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.subEvents[index].time}</p>
                                                    )}
                                                </div>

                                                {/* Day (only for multi-day events) */}
                                                {isMultiDay && (
                                                    <div key={`day-selector-${index}-${dayCount}-${formData.date}-${formData.endDate}-${renderKey}`}>
                                                        <label htmlFor={`subEvent-${index}-day`} className="block text-sm font-medium text-black/80 mb-1">
                                                            Day <span className="text-red-500">*</span>
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                ({dayCount} days available)
                                                            </span>
                                                        </label>
                                                        {/* Re-create the entire select on each render */}
                                                        {(() => {
                                                            const dayOptions = [];
                                                            for (let i = 0; i < dayCount; i++) {
                                                                dayOptions.push(i + 1);
                                                            }

                                                            return (
                                                                <select
                                                                    id={`subEvent-${index}-day`}
                                                                    value={subEvent.day || ''}
                                                                    onChange={(e) => handleSubEventChange(index, 'day', e.target.value)}
                                                                    className={`w-full px-3 py-2 border ${errors.subEvents?.[index]?.day ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                                                    aria-invalid={errors.subEvents?.[index]?.day ? "true" : "false"}
                                                                >
                                                                    <option value="">Select day</option>
                                                                    {dayOptions.map(day => (
                                                                        <option key={`day-${index}-${day}-${formData.date}-${formData.endDate}-${renderKey}`} value={day}>
                                                                            Day {day}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            );
                                                        })()}
                                                        {errors.subEvents?.[index]?.day && (
                                                            <p className="mt-1 text-sm text-red-600">{errors.subEvents[index].day}</p>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Sub-event location */}
                                                <div>
                                                    <label htmlFor={`subEvent-${index}-location`} className="block text-sm font-medium text-black/80 mb-1">
                                                        Location <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`subEvent-${index}-location`}
                                                        value={subEvent.location}
                                                        onChange={(e) => handleSubEventChange(index, 'location', e.target.value)}
                                                        className={`w-full px-3 py-2 border ${errors.subEvents?.[index]?.location ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                                        aria-invalid={errors.subEvents?.[index]?.location ? "true" : "false"}
                                                    />
                                                    {errors.subEvents?.[index]?.location && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.subEvents[index].location}</p>
                                                    )}
                                                </div>

                                                {/* Sub-event description */}
                                                <div>
                                                    <label htmlFor={`subEvent-${index}-description`} className="block text-sm font-medium text-black/80 mb-1">
                                                        Description <span className="text-red-500">*</span>
                                                    </label>
                                                    <textarea
                                                        id={`subEvent-${index}-description`}
                                                        value={subEvent.description}
                                                        onChange={(e) => handleSubEventChange(index, 'description', e.target.value)}
                                                        rows={2}
                                                        className={`w-full px-3 py-2 border ${errors.subEvents?.[index]?.description ? 'border-red-300' : 'border-black/20'} rounded-md focus:outline-none focus:ring-1 focus:ring-black`}
                                                        aria-invalid={errors.subEvents?.[index]?.description ? "true" : "false"}
                                                    />
                                                    {errors.subEvents?.[index]?.description && (
                                                        <p className="mt-1 text-sm text-red-600">{errors.subEvents[index].description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Error message for sub-events */}
                                {errors.subEvents && typeof errors.subEvents === 'string' && (
                                    <p className="mt-1 text-sm text-red-600">{errors.subEvents}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-black text-white px-4 py-2 rounded-md flex items-center hover:bg-black/80 transition-colors disabled:bg-black/60"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={16} className="mr-2" />
                                {isEditMode ? 'Update Event' : 'Save Event'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
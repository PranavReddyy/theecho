'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Navbar() {
    const [date, setDate] = useState('');
    const [formattedDate, setFormattedDate] = useState({ day: '', fullDate: '' });
    const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();
    const [countdownSettings, setCountdownSettings] = useState({
        enabled: true,
        targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        title: "Next Issue"
    });
    const [isClient, setIsClient] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }

        const handleEscKey = (e) => {
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleEscKey);
        return () => window.removeEventListener('keydown', handleEscKey);
    }, [isSearchOpen]);

    // Format current date in a newspaper style
    useEffect(() => {
        const now = new Date();
        const dayOptions = { weekday: 'long' };
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

        setDate(now.toLocaleDateString('en-US', { ...dateOptions, weekday: 'long' }));
        setFormattedDate({
            day: now.toLocaleDateString('en-US', dayOptions),
            fullDate: now.toLocaleDateString('en-US', dateOptions)
        });
    }, []);

    useEffect(() => {
        async function fetchCountdownSettings() {
            try {
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
            } catch (error) {
                console.error("Error fetching countdown settings:", error);
                // Use defaults if settings can't be fetched
            }
        }

        fetchCountdownSettings();
    }, []);

    // Countdown timer logic
    useEffect(() => {
        // Skip if countdown is disabled
        if (!countdownSettings.enabled) return;

        const targetDate = countdownSettings.targetDate;

        const updateCountdown = () => {
            const now = new Date();
            const difference = targetDate - now;

            if (difference <= 0) {
                // Target date has passed
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds });
        };

        // Update immediately
        updateCountdown();

        // Set up interval
        const interval = setInterval(updateCountdown, 1000);

        // Clean up interval
        return () => clearInterval(interval);
    }, [countdownSettings]);

    // Close mobile menu when path changes
    useEffect(() => {
        setIsMenuOpen(false);
        setIsSearchOpen(false); // Also close search when navigating
    }, [pathname]);

    const isActive = (path) => {
        return pathname === path ? 'border-b border-black' : '';
    };

    // Handle search submission
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setIsSearchOpen(false);
            setSearchQuery('');
        }
    };

    return (
        <header className="w-full bg-gradient-to-b from-[#ded8ca] to-white">
            <div className="max-w-[1200px] mx-auto">
                {/* Top Header Row - NYT style with logo on left, date and countdown on right */}
                <div className="flex justify-between items-center px-4 pt-4 pb-2">
                    {/* Logo - Left aligned on all screens */}
                    <div className="flex items-center">
                        <Link href="/news" className="block">
                            <Image
                                src="/echologo.png"
                                alt="The Echo"
                                width={130}
                                height={65}
                                className="object-contain"
                            />
                        </Link>
                    </div>

                    {/* Date and Countdown wrapper */}
                    <div className="flex items-center space-x-6">
                        {/* Date - Two lines to match countdown */}
                        <div className="hidden sm:block text-right">
                            <p className="text-xs uppercase font-semibold tracking-wide text-black/70">Today</p>
                            <p className="text-xs sm:text-sm font-medium italic">
                                {formattedDate.day}, {formattedDate.fullDate}
                            </p>
                        </div>

                        {/* Countdown Timer - Only show if enabled */}
                        {countdownSettings.enabled && (
                            <div className="text-right">
                                <div className="inline-block text-black">
                                    <p className="text-xs uppercase font-semibold tracking-wide text-black/70">
                                        {countdownSettings.title}
                                    </p>
                                    {isClient ? (
                                        <p className="text-xs sm:text-sm font-medium">
                                            <span className="sm:hidden">{countdown.days}d:{countdown.hours}h:{countdown.minutes}m:{countdown.seconds}s</span>
                                            <span className="hidden sm:inline">{countdown.days}d : {countdown.hours}h : {countdown.minutes}m : {countdown.seconds}s</span>
                                        </p>
                                    ) : (
                                        <p className="text-xs sm:text-sm font-medium">Loading...</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Links - NYT style with blur effect, no shadow */}
            <div className="sticky top-0 z-30 bg-transparent border-b border-black/10">
                <div className="max-w-[1200px] mx-auto relative">
                    {/* Mobile menu bar */}
                    <div className="md:hidden flex items-center justify-between px-4 py-2">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1 text-black focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? (
                                <X size={20} />
                            ) : (
                                <Menu size={20} />
                            )}
                        </button>
                        <div className="text-xs font-serif uppercase tracking-wide">
                            {pathname.replace('/', '') || 'news'}
                        </div>
                        <button
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                            className="p-1 text-black focus:outline-none"
                            aria-label="Search"
                        >
                            <Search size={18} />
                        </button>
                    </div>

                    {/* Mobile search bar */}
                    {isSearchOpen && (
                        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-black/10 z-50 px-4 py-3 shadow-sm">
                            <form
                                onSubmit={handleSearch}
                                className="flex items-center"
                            >
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search articles..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full p-2 text-sm border-b border-black/30 focus:border-black outline-none bg-transparent"
                                    autoComplete="off"
                                />
                                <button
                                    type="submit"
                                    className="ml-2 text-black/70 hover:text-black transition-colors"
                                    aria-label="Submit search"
                                >
                                    <Search size={18} />
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Mobile navigation menu - With dark brown background */}
                    <div
                        className={`z-1000 md:hidden absolute top-full left-0 right-0 transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                        style={{ backgroundColor: 'rgb(78,42,25)' }}
                    >
                        <nav className="flex flex-col divide-y divide-white/10">
                            <Link href="/news" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/news')}`}>News</Link>
                            <Link href="/ae" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/ae')}`}>A&E</Link>
                            <Link href="/forum" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/forum')}`}>Forum</Link>
                            <Link href="/sports" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/sports')}`}>Sports</Link>
                            <Link href="/events" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/events')}`}>Events</Link>
                            <Link href="/archive" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/archive')}`}>Archive</Link>
                            <Link href="/about" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/about')}`}>About</Link>
                            <Link href="/publish" className={`px-6 py-3 text-white hover:bg-white/10 ${isActive('/publish')}`}>Publish</Link>
                        </nav>
                    </div>

                    {/* Desktop navigation - NYT style with thinner borders */}
                    <nav className="hidden md:flex justify-between py-2 px-4 text-sm">
                        <div className="flex space-x-7">
                            <Link href="/news" className={`py-1 hover:text-black transition-colors ${isActive('/news')}`}>News</Link>
                            <Link href="/ae" className={`py-1 hover:text-black transition-colors ${isActive('/ae')}`}>A&E</Link>
                            <Link href="/forum" className={`py-1 hover:text-black transition-colors ${isActive('/forum')}`}>Forum</Link>
                            <Link href="/sports" className={`py-1 hover:text-black transition-colors ${isActive('/sports')}`}>Sports</Link>
                            <Link href="/events" className={`py-1 hover:text-black transition-colors ${isActive('/events')}`}>Events</Link>
                        </div>

                        <div className="flex items-center space-x-7">
                            <Link href="/archive" className={`py-1 hover:text-black transition-colors ${isActive('/archive')}`}>Archive</Link>
                            <Link href="/about" className={`py-1 hover:text-black transition-colors ${isActive('/about')}`}>About</Link>
                            <Link href="/publish" className={`py-1 hover:text-black transition-colors ${isActive('/publish')}`}>Publish</Link>

                            {/* Desktop Search Button & Search Bar */}
                            <div className="relative">
                                {!isSearchOpen ? (
                                    <button
                                        onClick={() => setIsSearchOpen(true)}
                                        className="p-1 -mr-1 text-black/70 hover:text-black transition-colors"
                                        aria-label="Open search"
                                    >
                                        <Search size={18} />
                                    </button>
                                ) : (
                                    <form onSubmit={handleSearch} className="flex items-center">
                                        <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder="Search articles..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-60 p-1 text-sm border-b border-black/30 focus:border-black outline-none bg-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setIsSearchOpen(false)}
                                            className="ml-2 text-black/70 hover:text-black"
                                            aria-label="Close search"
                                        >
                                            <X size={16} />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}
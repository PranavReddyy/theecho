'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image';
// Update this import to include Inbox (note the lowercase 'b')
import { LogOut, FileText, Calendar, BarChart3, Inbox } from 'lucide-react';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';

// Use Inter font for admin UI
const interFont = Inter({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700']
});

function AdminLayoutContent({ children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // If not loading and no user, redirect to login
        if (!loading && !user && pathname !== '/admin/login') {
            router.push('/admin/login');
        }
    }, [user, loading, router, pathname]);

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
            router.push('/admin/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Pathname is /admin/login, show only the children
    if (pathname === '/admin/login') {
        return <div className={interFont.className}>{children}</div>;
    }

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className={`${interFont.className} flex items-center justify-center h-screen bg-white`}>
                <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    // If not authenticated and not on login page, don't render anything (redirect is happening)
    if (!user && pathname !== '/admin/login') {
        return null;
    }

    // Get current page name for header
    const getPageName = () => {
        if (pathname === '/admin') return 'Dashboard';
        if (pathname === '/admin/articles') return 'Articles';
        if (pathname.includes('/admin/articles/new')) return 'New Article';
        if (pathname.includes('/admin/articles/edit')) return 'Edit Article';
        if (pathname === '/admin/events') return 'Events';
        if (pathname.includes('/admin/events/new')) return 'New Event';
        if (pathname.includes('/admin/events/edit')) return 'Edit Event';
        if (pathname === '/admin/submissions') return 'Submissions';
        if (pathname.includes('/admin/submissions/preview')) return 'Preview Submission';
        return 'Admin';
    };

    return (
        <div className={`${interFont.className} min-h-screen bg-white`}>
            {/* Simple admin header */}
            <header className="bg-white border-b border-black/10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo and title */}
                        <div className="flex items-center">
                            <Link href="/admin" className="flex items-center space-x-3">
                                <Image
                                    src="/echologo.png"
                                    alt="The Echo"
                                    width={40}
                                    height={40}
                                    className="object-contain"
                                />
                                <span className="text-lg font-medium">Admin</span>
                            </Link>
                        </div>

                        {/* Navigation links */}
                        <nav className="hidden md:flex items-center space-x-6">
                            <Link
                                href="/admin"
                                className={`text-sm font-medium ${pathname === '/admin' ? 'text-black' : 'text-black/60 hover:text-black'}`}
                            >
                                <div className="flex items-center">
                                    <BarChart3 size={16} className="mr-1" />
                                    Dashboard
                                </div>
                            </Link>
                            <Link
                                href="/admin/articles"
                                className={`text-sm font-medium ${pathname.startsWith('/admin/articles') ? 'text-black' : 'text-black/60 hover:text-black'}`}
                            >
                                <div className="flex items-center">
                                    <FileText size={16} className="mr-1" />
                                    Articles
                                </div>
                            </Link>
                            <Link
                                href="/admin/events"
                                className={`text-sm font-medium ${pathname.startsWith('/admin/events') ? 'text-black' : 'text-black/60 hover:text-black'}`}
                            >
                                <div className="flex items-center">
                                    <Calendar size={16} className="mr-1" />
                                    Events
                                </div>
                            </Link>
                            <Link
                                href="/admin/submissions"
                                className={`text-sm font-medium ${pathname.startsWith('/admin/submissions') ? 'text-black' : 'text-black/60 hover:text-black'}`}
                            >
                                <div className="flex items-center">
                                    {/* Changed from InBox to Inbox */}
                                    <Inbox size={16} className="mr-1" />
                                    Submissions
                                </div>
                            </Link>
                            <Link
                                href="/news"
                                className="text-sm font-medium text-black/60 hover:text-black"
                                target="_blank"
                            >
                                View Site
                            </Link>
                        </nav>

                        {/* User actions */}
                        <div className="flex items-center">
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-3 py-2 text-sm font-medium text-black/70 hover:text-black"
                            >
                                <LogOut size={16} className="mr-2" />
                                <span className="hidden sm:inline">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Current page title bar */}
            <div className="bg-white border-b border-black/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="py-4 text-xl font-medium">{getPageName()}</h1>
                </div>
            </div>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}

export default function AdminLayout({ children }) {
    return (
        <AuthProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </AuthProvider>
    );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useAuth } from '../../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user, login } = useAuth();

    useEffect(() => {
        // If user is already logged in, redirect to admin dashboard
        if (user) {
            router.push('/admin');
        }
    }, [user, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            router.push('/admin');
        } catch (error) {
            console.error('Login error:', error);
            setError('Failed to log in. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
            <motion.div
                className="bg-white p-8 sm:p-10 rounded-lg shadow-sm border border-black/10 w-full max-w-md"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/echologo.png"
                            alt="The Echo"
                            width={100}
                            height={100}
                            className="object-contain"
                        />
                    </div>
                    <h1 className="text-2xl font-bold mb-1">Admin Login</h1>
                    <p className="text-black/60 text-sm">Sign in to access The Echo admin panel</p>
                </div>

                {error && (
                    <motion.div
                        className="bg-red-50 text-red-700 p-3 rounded-md mb-6 text-sm"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-1 text-black/70">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-black/20 focus:border-black outline-none transition-colors"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-1 text-black/70">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-black/20 focus:border-black outline-none transition-colors"
                            placeholder="Enter your password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-black text-white py-2 font-medium hover:bg-black/80 transition-colors disabled:bg-black/40"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 size={18} className="animate-spin mr-2" />
                                Signing in...
                            </span>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
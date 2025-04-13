'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export default function ScrollToTop() {
    const [showButton, setShowButton] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Check on initial load
        handleResize();

        const handleScroll = () => {
            // Reduce threshold for mobile screens - they're typically shorter
            const threshold = window.innerWidth < 768 ? 150 : 300;
            setShowButton(window.scrollY > threshold);
        };

        // Initial check in case page loads already scrolled
        handleScroll();

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', () => {
            handleResize();
            handleScroll();
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <AnimatePresence>
            {showButton && (
                <motion.button
                    onClick={scrollToTop}
                    style={{
                        position: 'fixed',
                        bottom: isMobile ? '16px' : '24px',
                        right: isMobile ? '16px' : '24px',
                        zIndex: 9999
                    }}
                    className="bg-black text-white p-3 rounded-full shadow-lg hover:bg-[#4f2a19] focus:outline-none"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Scroll to top"
                >
                    <ArrowUp size={isMobile ? 18 : 20} />
                </motion.button>
            )}
        </AnimatePresence>
    );
}
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';

// Simplified archive data - only three editions
const archiveData = [
    {
        id: 'edition-7',
        title: 'Edition 7',
        date: 'April 5, 2025',
        thumbnail: '/publications/img/ed7.png',
        pdfUrl: '/publications/Edition_07.pdf',
    },
    {
        id: 'edition-9',
        title: 'Edition 9',
        date: 'March 18, 2025',
        thumbnail: '/publications/img/ed9.png',
        pdfUrl: '/publications/Edition_09.pdf',
    }
];

export default function ArchivePage() {
    const [hoveredItem, setHoveredItem] = useState(null);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
    };

    return (
        <div className="py-8">
            {/* Simple Header */}
            <motion.div
                className="mb-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl md:text-4xl font-bold mb-2 text-center tracking-tight">
                    Archive
                </h1>
                <div className="w-16 h-[1px] bg-black/20 mx-auto"></div>
            </motion.div>

            {/* Compact Publications List */}
            <motion.div
                className="max-w-2xl mx-auto px-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {archiveData.map((publication) => (
                    <motion.div
                        key={publication.id}
                        variants={itemVariants}
                        className="mb-6"
                        onMouseEnter={() => setHoveredItem(publication.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                    >
                        <div className="flex items-center gap-4 group">
                            {/* Smaller Image */}
                            <motion.div
                                className="relative h-[100px] w-[160px] rounded-lg overflow-hidden shadow-sm flex-shrink-0"
                                whileHover={{ scale: 1.03 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image
                                    src={publication.thumbnail}
                                    alt={publication.title}
                                    fill
                                    className="object-cover transition-transform duration-500"
                                    style={{
                                        transform: hoveredItem === publication.id ? 'scale(1.08)' : 'scale(1)'
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                            </motion.div>

                            {/* Publication Details - Minimized */}
                            <div className="flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-center">
                                    <motion.h3
                                        className="text-lg font-bold leading-tight"
                                        initial={{ x: 0 }}
                                        animate={{ x: hoveredItem === publication.id ? 1 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {publication.title}
                                    </motion.h3>

                                    {/* Download Button - Made more prominent */}
                                    <motion.a
                                        href={publication.pdfUrl}
                                        download
                                        aria-label={`Download ${publication.title}`}
                                        className="text-black/70 hover:text-black p-2 hover:bg-black/5 rounded-full transition-colors"
                                        whileHover={{ scale: 1.15 }}
                                        whileTap={{ scale: 0.9 }}
                                    >
                                        <Download size={18} />
                                    </motion.a>
                                </div>

                                <p className="text-xs text-black/60 mt-1">
                                    {publication.date}
                                </p>

                                {/* Removed the "Download PDF" button */}
                            </div>
                        </div>

                        {/* Thin divider */}
                        <div className="h-[1px] bg-black/5 mt-4"></div>
                    </motion.div>
                ))}
            </motion.div>
        </div>
    );
}
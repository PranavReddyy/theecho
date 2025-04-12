import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ArticleCard({ article, featured = false }) {
    if (!article) return null;

    const { id, title, description, category, author, date, imageUrl, slug } = article;
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const getUrl = () => {
        // Use kebab-case format for URLs
        switch (category.toLowerCase()) {
            case 'news': return `/news/${slug}`;
            case 'a&e': case 'ae': return `/ae/${slug}`;
            case 'forum': return `/forum/${slug}`;
            case 'sports': return `/sports/${slug}`;
            default: return `/news/${slug}`;
        }
    };

    // Featured article (NYT lead story style)
    return (
        <div className="mb-6">
            <Link href={getUrl()}>
                <motion.div
                    className="group cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                >
                    {/* Text Content - Left side on desktop */}
                    <div className="md:col-span-7 flex flex-col justify-center order-2 md:order-1">
                        {/* Category Tag */}
                        <motion.span
                            className="inline-block text-xs font-bold tracking-widest uppercase mb-3 text-black/70"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                        >
                            {category}
                        </motion.span>

                        {/* Title */}
                        <motion.h2
                            className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.7 }}
                            whileHover={{ x: 2 }}
                        >
                            <span className="bg-left-bottom bg-gradient-to-r from-black to-black bg-[length:0%_1px] bg-no-repeat group-hover:bg-[length:100%_1px] transition-all duration-500">
                                {title}
                            </span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            className="text-base md:text-lg text-black/80 mb-6 leading-relaxed first-letter:text-2xl first-letter:font-bold"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.7 }}
                        >
                            {description}
                        </motion.p>

                        {/* Author and Date */}
                        <div className="flex items-center text-sm text-black/60">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                            >
                                By <span className="font-medium">{author || 'Anonymous'}</span>
                            </motion.span>
                            <span className="mx-2">•</span>
                            <motion.time
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.7, duration: 0.5 }}
                            >
                                {formattedDate}
                            </motion.time>
                        </div>
                    </div>

                    {/* Image - Right side on desktop */}
                    {imageUrl && (
                        <motion.div
                            className="md:col-span-5 relative h-[300px] md:h-[400px] overflow-hidden order-1 md:order-2"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            whileHover={{ scale: 1.02 }}
                        >
                            <Image
                                src={imageUrl}
                                alt={title}
                                fill
                                priority
                                className="object-cover"
                            />
                        </motion.div>
                    )}
                </motion.div>
            </Link>
        </div>
    );
}
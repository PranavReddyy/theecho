'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Instagram, Twitter, Linkedin, Mail, ChevronDown, ChevronUp } from 'lucide-react';

// Team data for 2024-2025
const teamMembers = [
    {
        name: "Ananya Agarwal",
        role: "Editor-in-Chief",
        image: "/2024/ananya.jpg"
    },
    {
        name: "Mounami Jagarapu",
        role: "Editor-in-Chief",
        image: "/2024/mounami.jpg"
    },
    {
        name: "Buri Akshaya",
        role: "Deputy Editor-in-Chief",
        image: "/2024/akshaya.jpg"
    },
    {
        name: "Mandela Chanikya Naidu",
        role: "Forum Editor",
        image: "/2024/chunky.jpg"
    },
    {
        name: "Amithi Shangari",
        role: "A&E Editor",
        image: "/2024/ami.jpg"
    },
    {
        name: "Kashif Rahiman Shaik",
        role: "A&E Editor",
        image: "/2024/kashif.jpg"
    },
    {
        name: "Shrilekha Jaligama",
        role: "News Editor",
        image: "/2024/shri.jpg"
    },
    {
        name: "Abhinav Jata",
        role: "News Editor",
        image: "/2024/aj.jpg"
    },
    {
        name: "Anush Mohanty",
        role: "Sports Editor",
        image: "/2024/anush.jpg"
    },
    {
        name: "Avyaya Mohan",
        role: "Sports Editor",
        image: "/2024/avyay.jpg"
    },
    {
        name: "Aanchal Mathur",
        role: "Social Media & Marketing",
        image: "/2024/aanchal.jpg"
    },
    {
        name: "Nysha Baruah",
        role: "Social Media & Marketing",
        image: "/2024/nysha.jpg"
    },
    {
        name: "Dhruv Maheshwari",
        role: "Design Head",
        image: "/2024/dhruv.jpg"
    },
    {
        name: "Yathi Voruganti",
        role: "Design Team",
        image: "/2024/yathi.jpg"
    },
    {
        name: "Byagari Rithika",
        role: "Design Team",
        image: "/2024/rithika.jpg"
    },
    {
        name: "Anisha Raju",
        role: "Illustrator",
        image: "/2024/raju.jpg"
    },
    {
        name: "Pamidimukkala Bhargavi",
        role: "Tech Head",
        image: "/2024/bhargavi.jpg"
    },
    {
        name: "Mitta Pranav Reddy",
        role: "Tech Head",
        image: "/2024/pranav.jpg"
    }
];

// Team data for 2023-2024 (previous year)
const teamPrevious = [
    {
        name: "Emily Johnson",
        role: "Editor-in-Chief",
        image: "https://images.unsplash.com/photo-1554727242-741c14fa561c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDB8fDB8fHww",
        twitter: "https://twitter.com/emilyjohnson",
        linkedin: "https://linkedin.com/in/emilyjohnson",
        email: "emily.johnson@alumni.theecho.edu"
    },
    {
        name: "Daniel Park",
        role: "Managing Editor",
        image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fHByb2Zlc3Npb25hbCUyMG1hbnxlbnwwfHwwfHx8MA%3D%3D",
        twitter: "https://twitter.com/danielpark",
        linkedin: "https://linkedin.com/in/danielpark",
        email: "daniel.park@alumni.theecho.edu"
    },
    {
        name: "Aisha Khan",
        role: "News Editor",
        image: "https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fHByb2Zlc3Npb25hbCUyMHdvbWFufGVufDB8fDB8fHww",
        twitter: "https://twitter.com/aishakhan",
        email: "aisha.khan@alumni.theecho.edu"
    },
    {
        name: "Brian Wilson",
        role: "Campus Reporter",
        image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzJ8fHByb2Zlc3Npb25hbCUyMG1hbnxlbnwwfHwwfHx8MA%3D%3D",
        linkedin: "https://linkedin.com/in/brianwilson",
        email: "brian.wilson@alumni.theecho.edu"
    },
    {
        name: "Dr. Elizabeth Barnes",
        role: "Faculty Advisor",
        image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODB8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D",
        linkedin: "https://linkedin.com/in/elizabethbarnes",
        email: "elizabeth.barnes@university.edu"
    },
    {
        name: "Prof. Robert Davis",
        role: "Journalism Department Chair",
        image: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fHByb2ZpbGV8ZW58MHx8MHx8fDA%3D",
        linkedin: "https://linkedin.com/in/robertdavis",
        email: "robert.davis@university.edu"
    }
];

// Available team years
const teamYears = [
    { year: "2024-2025", data: teamMembers }
];

// Enhanced Team Member Card Component
function TeamMemberCard({ member, index }) {
    // Check if this member has any social links
    const hasSocialLinks = member.twitter || member.instagram || member.linkedin || member.email;

    return (
        <motion.div
            className="group relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.03 }}
            whileHover={{ y: -4 }}
        >
            <div className="p-2 sm:p-5 flex flex-col items-center">
                {/* Image with refined styling and hover effects - smaller on mobile */}
                <div className="relative w-20 h-20 sm:w-32 sm:h-32 mb-2 sm:mb-4 overflow-hidden rounded-full border border-black/10 transition-shadow duration-200 group-hover:shadow-md">
                    <div className="absolute inset-0 bg-black/5 group-hover:bg-black/0 transition-colors duration-300 z-10"></div>
                    <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        sizes="(max-width: 640px) 80px, 150px"
                    />
                </div>

                {/* Member details with improved typography - smaller on mobile */}
                <div className="text-center w-full">
                    <h3 className="font-bold text-sm sm:text-lg leading-tight mb-0.5 sm:mb-1 group-hover:text-black transition-colors duration-300">
                        {member.name}
                    </h3>
                    <p className="text-black/60 text-xs sm:text-sm italic mb-2 sm:mb-3 group-hover:text-black/80 transition-colors duration-300">
                        {member.role}
                    </p>

                    {/* Only render social links section if at least one link exists */}
                    {hasSocialLinks && (
                        <div className="flex justify-center space-x-4 mt-1">
                            {member.twitter && (
                                <motion.a
                                    href={member.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black/40 hover:text-black transition-colors duration-300"
                                    aria-label={`${member.name}'s Twitter`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Twitter size={15} />
                                </motion.a>
                            )}
                            {member.instagram && (
                                <motion.a
                                    href={member.instagram}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black/40 hover:text-black transition-colors duration-300"
                                    aria-label={`${member.name}'s Instagram`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Instagram size={15} />
                                </motion.a>
                            )}
                            {member.linkedin && (
                                <motion.a
                                    href={member.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-black/40 hover:text-black transition-colors duration-300"
                                    aria-label={`${member.name}'s LinkedIn`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Linkedin size={15} />
                                </motion.a>
                            )}
                            {member.email && (
                                <motion.a
                                    href={`mailto:${member.email}`}
                                    className="text-black/40 hover:text-black transition-colors duration-300"
                                    aria-label={`Email ${member.name}`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Mail size={15} />
                                </motion.a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Elegant bottom border that appears on hover */}
            <motion.div
                className="absolute bottom-0 left-[10%] right-[10%] h-[1px] bg-black/10"
                initial={{ scaleX: 0 }}
                whileHover={{ scaleX: 1 }}
                transition={{ duration: 0.3 }}
            />
        </motion.div>
    );
}

export default function AboutPage() {
    // Track if the content has loaded for animations
    const [contentLoaded, setContentLoaded] = useState(false);

    // State for current year selection (default to latest year)
    const [selectedYear, setSelectedYear] = useState("2024-2025");

    // State for transition animation
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Get the active team data based on selection
    const activeTeamData = selectedYear === "2024-2025" ? teamMembers : teamPrevious;

    // Set content as loaded after a brief delay for a more polished load sequence
    useEffect(() => {
        const timer = setTimeout(() => setContentLoaded(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Animation variants for staggered appearance
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.03,
                delayChildren: 0.2
            }
        }
    };

    // Handle year change with transition effect
    const changeYear = (year) => {
        if (year === selectedYear) return;

        setIsTransitioning(true);

        // Short delay to allow exit animation
        setTimeout(() => {
            setSelectedYear(year);
            setIsTransitioning(false);
        }, 300);
    };

    return (
        <div className="py-8">
            {/* Hero Section with refined typography */}
            <motion.section
                className="mb-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
            >
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center tracking-tight">
                    About The Echo
                </h1>

                <div className="max-w-3xl mx-auto px-4">
                    <p className="text-lg text-black/80 mb-7 leading-relaxed first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:float-left first-letter:leading-none">
                        In the coming months, you can expect to see new perspectives, thought provoking pieces, and carefully curated editions from our committed team of writers, editors, and illustrators. We strive to foster a sense of community and connection through the pages of The Echo by not just sharing  your stories, but by amplifying your voices and resonating with your experiences.
                    </p>

                    <p className="text-lg text-black/80 mb-7 leading-relaxed">
                        The Echo is your newspaper as much as it is ours and we&apos;re always here to listen to your feedback and suggestions. Whether you&apos;re a student or a faculty member, we invite you to join us in making our paper an indispensable part of our university.
                    </p>

                    <p className="text-lg text-black/80 leading-relaxed">
                        We are extremely grateful to be part of something that embodies the spirit and essence of our university, and as we move forward, we hope all of you reach out, engage with  us, and make &apos;The Echo&apos; your own
                    </p>
                </div>
            </motion.section>

            {/* Elegant divider */}
            <motion.div
                className="max-w-[100px] mx-auto mb-16 flex items-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <div className="h-[1px] flex-grow bg-black/20"></div>
                <div className="w-2 h-2 rounded-full bg-black/40 mx-1"></div>
                <div className="h-[1px] flex-grow bg-black/20"></div>
            </motion.div>

            {/* Team Section with Year Selector */}
            <section className="mt-16">
                <div className="flex flex-col items-center mb-16">
                    <motion.h2
                        className="text-2xl font-bold mb-6 text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        Our Team
                    </motion.h2>

                    {/* Elegant Year Selector */}
                    <motion.div
                        className="relative flex items-center gap-1 border-b border-black/10 p-1 mx-auto"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {/* <button
                            onClick={() => changeYear("2023-2024")}
                            className={`relative px-4 py-1.5 transition-all duration-300 ${selectedYear === "2023-2024" ? "text-black font-medium" : "text-black/50 hover:text-black/70"}`}
                            disabled={isTransitioning}
                        >
                            <span>2023-2024</span>
                            {selectedYear === "2023-2024" && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                                    layoutId="yearIndicator"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button> */}

                        {/* <span className="text-black/20 mx-1">|</span> */}

                        <button
                            onClick={() => changeYear("2024-2025")}
                            className={`relative px-4 py-1.5 transition-all duration-300 ${selectedYear === "2024-2025" ? "text-black font-medium" : "text-black/50 hover:text-black/70"}`}
                            disabled={isTransitioning}
                        >
                            <span>2024-2025</span>
                            {selectedYear === "2024-2025" && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-black"
                                    layoutId="yearIndicator"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                        </button>
                    </motion.div>
                </div>

                {/* Team Member Grid with transition between years */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedYear}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 px-4"
                    >
                        {activeTeamData.map((member, index) => (
                            <TeamMemberCard key={`${selectedYear}-${index}`} member={member} index={index} />
                        ))}
                    </motion.div>
                </AnimatePresence>

                {/* Archive Note */}
                {selectedYear !== "2024-2025" && (
                    <motion.div
                        className="mt-10 text-center text-black/60 italic text-sm px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        You're viewing an archived team roster. These members may have graduated or moved on to other roles.
                    </motion.div>
                )}
            </section>

            {/* Join Us Section with refined styling */}
            <motion.section
                className="mt-24 py-14 border-t border-black/10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
            >
                <div className="max-w-3xl mx-auto text-center px-4">
                    <h2 className="text-2xl font-bold mb-6 text-center">Join The Echo</h2>
                    <p className="text-lg text-black/70 mb-10 leading-relaxed">
                        The Echo welcomes students from all backgrounds and disciplines. Whether you're interested in writing, photography, design, or digital media, there's a place for you on our team.
                    </p>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Link
                            href="/publish"
                            className="inline-block bg-black text-white px-10 py-3 font-bold hover:bg-gray-800 transition-colors group relative overflow-hidden"
                        >
                            <span className="relative z-10">Contribute Your Voice</span>
                            <motion.span
                                className="absolute inset-0 bg-gray-800 z-0"
                                initial={{ x: '-100%' }}
                                whileHover={{ x: 0 }}
                                transition={{ duration: 0.3 }}
                            />
                        </Link>
                    </motion.div>
                </div>
            </motion.section>
        </div>
    );
}
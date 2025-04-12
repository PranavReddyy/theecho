import Link from 'next/link';
import { Instagram, Twitter, Linkedin } from 'lucide-react'; // Add these imports

export default function Footer() {
    return (
        <>
            <footer className="py-12 bg-gradient-to-b from-white to-[#ded8ca]">
                <div className="max-w-[1200px] mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        {/* About section - unchanged */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-black">About The Echo</h3>
                            <p className="text-sm text-black">
                                The Echo is a student-run newspaper dedicated to providing timely,
                                relevant news and creative content to the university community.
                            </p>
                        </div>

                        {/* Categories section - unchanged */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-black">Categories</h3>
                            <ul className="text-sm space-y-2 text-black">
                                <li><Link href="/news" className="text-black">News</Link></li>
                                <li><Link href="/ae" className="text-black">Arts & Entertainment</Link></li>
                                <li><Link href="/forum" className="text-black">Forum</Link></li>
                                <li><Link href="/sports" className="text-black">Sports</Link></li>
                            </ul>
                        </div>

                        {/* Resources section - unchanged */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-black">Resources</h3>
                            <ul className="text-sm space-y-2 text-black">
                                <li><Link href="/about" className="text-black">Our Team</Link></li>
                                <li><Link href="/archive" className="text-black">Archive</Link></li>
                                <li><Link href="/events" className="text-black">Events</Link></li>
                                <li><Link href="/publish" className="text-black">Submit Content</Link></li>
                            </ul>
                        </div>

                        {/* Contact section - added social links */}
                        <div>
                            <h3 className="text-lg font-bold mb-4 text-black">Contact</h3>
                            <address className="text-sm not-italic text-black mb-4">
                                <p>Mahindra University, Hyderabad</p>
                            </address>

                            {/* Social Media Links */}
                            <div className="mt-2">
                                <div className="flex space-x-3">
                                    <a href="https://instagram.com/theechonews" target="_blank" rel="noopener noreferrer" className="text-black/70 hover:text-black transition-colors">
                                        <Instagram size={20} />
                                    </a>
                                    <a href="https://www.linkedin.com/company/the-echo-mu/" target="_blank" rel="noopener noreferrer" className="text-black/70 hover:text-black transition-colors">
                                        <Linkedin size={20} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 pt-6 border-t border-black/20 text-center text-sm text-black">
                        <p>© {new Date().getFullYear()} The Echo. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </>
    );
}
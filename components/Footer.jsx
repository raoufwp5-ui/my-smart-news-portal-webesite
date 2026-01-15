import Link from 'next/link';
import { Github, Twitter, Facebook, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 transition-colors duration-300">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <Link href="/" className="text-2xl font-bold text-gray-900 dark:text-white mb-4 block">
                            Global Brief
                        </Link>
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            Global Brief provides in-depth reporting and analysis on the most critical stories shaping our world. Your trusted source for business, technology, politics, and sports coverage.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Categories</h3>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li><Link href="/business" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Business</Link></li>
                            <li><Link href="/technology" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Technology</Link></li>
                            <li><Link href="/politics" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Politics</Link></li>
                            <li><Link href="/sports" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Sports</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h3>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                            <li><Link href="/about" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Contact</Link></li>
                            <li><Link href="/privacy-policy" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/editorial-policy" className="hover:text-red-600 dark:hover:text-red-400 transition-colors">Editorial Policy</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Follow Us</h3>
                        <div className="flex space-x-4">
                            <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white transition-all">
                                <Github size={18} />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all">
                                <Mail size={18} />
                            </a>
                        </div>
                        <p className="mt-4 text-xs text-gray-500">
                            © {new Date().getFullYear()} Global Brief. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

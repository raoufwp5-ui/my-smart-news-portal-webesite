import Link from 'next/link';
import { Twitter, Linkedin, User } from 'lucide-react';
import Image from 'next/image';
import AuthorAvatar from './AuthorAvatar';

export default function AuthorCard({ author }) {
    if (!author) return null;

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 my-12 flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left transition-all hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-700">
            {/* Avatar */}
            <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-sm relative">
                    {author.avatar ? (
                        // Using a reliable placeholder for now if local image missing, or standard Image if present
                        // Using a reliable placeholder for now if local image missing, or standard Image if present
                        <AuthorAvatar
                            src={author.avatar}
                            name={author.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <User size={32} className="text-gray-400" />
                        </div>
                    )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-sm">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1">
                <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start gap-2 mb-2">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            <Link href={`/author/${author.id}`} className="hover:text-blue-600 transition-colors">
                                {author.name}
                            </Link>
                        </h3>
                        <div className="text-sm font-medium text-blue-600 uppercase tracking-wider">{author.role}</div>
                    </div>

                    {/* Social Links */}
                    <div className="flex gap-3">
                        {author.social?.twitter && (
                            <a href={author.social.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1DA1F2] transition-colors">
                                <Twitter size={18} />
                            </a>
                        )}
                        {author.social?.linkedin && (
                            <a href={author.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0A66C2] transition-colors">
                                <Linkedin size={18} />
                            </a>
                        )}
                    </div>
                </div>

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                    {author.bio}
                </p>

                <div className="flex justify-center md:justify-start">
                    <Link href={`/author/${author.id}`} className="text-sm font-semibold text-gray-900 dark:text-white border-b-2 border-transparent hover:border-blue-600 transition-all">
                        View all articles
                    </Link>
                </div>
            </div>
        </div>
    );
}

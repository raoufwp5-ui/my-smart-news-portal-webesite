import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Linkedin, User } from 'lucide-react';
import AuthorAvatar from '@/components/AuthorAvatar';
import authors from '@/data/authors.json';

export const metadata = {
    title: 'Editorial Team - Global Brief',
    description: 'Meet the expert analysts and editors behind Global Brief content.',
};

export default function AuthorsIndex() {
    return (
        <main className="min-h-screen bg-white dark:bg-gray-950 pb-20">
            {/* Header */}
            <div className="bg-gray-100 dark:bg-gray-900 py-20 text-center">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">
                        Meet Our Editorial Team
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Global Brief is driven by a diverse team of experts, analysts, and futurists dedicated to decoding the complexity of our changing world.
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="container mx-auto px-4 -mt-10 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {authors.map(author => (
                        <div key={author.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:-translate-y-2 transition-transform duration-300 group">
                            <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700 relative">
                                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 shadow-md overflow-hidden bg-white">
                                    <AuthorAvatar
                                        src={author.avatar}
                                        name={author.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="pt-20 pb-8 px-6 text-center">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    <Link href={`/author/${author.id}`} className="hover:text-blue-600 transition-colors">
                                        {author.name}
                                    </Link>
                                </h3>
                                <div className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-6">{author.role}</div>

                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-8 line-clamp-3">
                                    {author.bio}
                                </p>

                                <Link href={`/author/${author.id}`} className="inline-block px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-bold text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
                                    View Full Profile
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="container mx-auto px-4 mt-20 text-center">
                <p className="text-gray-500">
                    Interested in joining our team? <a href="/contact" className="text-blue-600 font-bold hover:underline">Contact us</a>
                </p>
            </div>
        </main>
    );
}

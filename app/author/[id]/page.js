import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Twitter, Linkedin, MapPin, ArrowLeft } from 'lucide-react';
import NewsCard from '@/components/NewsCard';
import authors from '@/data/authors.json';
import articlesIndex from '@/data/articles-index.json';
import AuthorAvatar from '@/components/AuthorAvatar';

// 0. Static Params Generation (Crucial for avoiding 404 on Vercel)
export async function generateStaticParams() {
    return authors.map((author) => ({
        id: author.id,
    }));
}

// 1. Get Author Data (Direct Lookup)
function getAuthor(id) {
    return authors.find(a => a.id === id) || null;
}

// 2. Get Articles by Author (Direct Lookup)
function getAuthorArticles(authorId) {
    try {
        return articlesIndex.articles.filter(article => article.authorId === authorId);
    } catch (e) {
        return [];
    }
}

export async function generateMetadata({ params }) {
    const author = await getAuthor(params.id);
    if (!author) return { title: 'Author Not Found' };
    return {
        title: `${author.name} - Global Brief`,
        description: `Read the latest articles and insights from ${author.name}, ${author.role} at Global Brief.`,
        openGraph: {
            images: [author.avatar]
        }
    };
}

export default async function AuthorPage({ params }) {
    const { id } = params;
    const author = await getAuthor(id);

    if (!author) {
        notFound();
    }

    const articles = await getAuthorArticles(id);

    return (
        <main className="min-h-screen bg-white dark:bg-gray-950 pb-20">
            {/* Header / Cover */}
            <div className="bg-gray-100 dark:bg-gray-900 h-64 w-full relative">
                <div className="absolute top-8 left-8">
                    <Link href="/" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white font-bold transition-colors">
                        <ArrowLeft size={20} className="mr-2" /> Back to Home
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-10 items-start">

                    {/* Sidebar Profile */}
                    <div className="w-full md:w-1/3 lg:w-1/4 bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-800 text-center md:text-left sticky top-8">
                        <div className="w-40 h-40 mx-auto md:mx-0 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg -mt-24 mb-6 relative bg-gray-200">
                            <AuthorAvatar
                                src={author.avatar}
                                name={author.name}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">{author.name}</h1>
                        <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mb-6">{author.role}</p>

                        <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                            {author.bio}
                        </p>

                        <div className="flex justify-center md:justify-start gap-4 mb-8">
                            {author.social?.twitter && (
                                <a href={author.social.twitter} target="_blank" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-blue-400 hover:text-white transition-all">
                                    <Twitter size={20} />
                                </a>
                            )}
                            {author.social?.linkedin && (
                                <a href={author.social.linkedin} target="_blank" className="p-3 bg-gray-50 dark:bg-gray-800 rounded-full hover:bg-blue-700 hover:text-white transition-all">
                                    <Linkedin size={20} />
                                </a>
                            )}
                        </div>

                        <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                                <span className="font-bold text-black dark:text-white">{articles.length}</span> Published Articles
                            </div>
                        </div>
                    </div>

                    {/* Main Content: Article Grid */}
                    <div className="flex-1 w-full">
                        <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                            <span className="w-2 h-8 bg-red-600 rounded-full"></span>
                            Latest from {author.name.split(' ')[0]}
                        </h2>

                        {articles.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {articles.map(article => (
                                    <NewsCard key={article.slug} article={article} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                <p className="text-gray-500">No articles published yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

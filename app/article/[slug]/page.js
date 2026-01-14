import { getArticleBySlug } from '@/lib/articleStore';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

export async function generateMetadata({ params, searchParams }) {
    const { slug } = params;
    const article = getArticleBySlug(slug);

    if (!article) {
        return {
            title: 'Article Not Found | Global Brief',
            description: 'The requested article could not be found.',
        };
    }

    return {
        title: `${article.title} | Global Brief`,
        description: article.tldr ? article.tldr[0] : article.title,
        openGraph: {
            title: article.title,
            description: article.tldr ? article.tldr[0] : article.title,
            images: article.image ? [article.image] : [],
        },
    };
}

export default async function ArticlePage({ params, searchParams }) {
    const { slug } = params;

    const article = getArticleBySlug(slug);

    if (!article) {
        notFound();
    }

    return (
        <article className="min-h-screen bg-white dark:bg-gray-950 pb-20">
            {/* Hero Image */}
            <div className="w-full h-[400px] relative bg-gray-200 dark:bg-gray-900">
                <img
                    src={article.image || '/default-news.jpg'}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-8 container mx-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4 text-white/90 mb-4 text-sm font-medium">
                            <span className="bg-blue-600 px-3 py-1 rounded text-white uppercase tracking-wider text-xs">
                                {article.category || 'News'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(article.pubDate || article.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                4 min read
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 shadow-sm">
                            {article.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 -mt-10 relative z-10">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-800">

                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8 font-medium group">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to News
                    </Link>

                    {/* TL;DR Section */}
                    {article.tldr && Array.isArray(article.tldr) && (
                        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border-l-4 border-blue-600">
                            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">TL;DR</h3>
                            <ul className="space-y-2">
                                {article.tldr.map((point, i) => (
                                    <li key={i} className="text-gray-700 dark:text-gray-300 flex items-start">
                                        <span className="mr-2 text-blue-500 font-bold">•</span>
                                        {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Article Content */}
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {article.content.split('\n').map((paragraph, idx) => {
                            // Handle markdown headers
                            if (paragraph.startsWith('## ')) {
                                return (
                                    <h2 key={idx} className="text-2xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
                                        {paragraph.replace('## ', '')}
                                    </h2>
                                );
                            }
                            if (paragraph.startsWith('### ')) {
                                return (
                                    <h3 key={idx} className="text-xl font-bold mt-6 mb-3 text-gray-900 dark:text-white">
                                        {paragraph.replace('### ', '')}
                                    </h3>
                                );
                            }
                            if (paragraph.trim() === '') {
                                return null;
                            }
                            return (
                                <p key={idx} className="mb-4 text-gray-800 dark:text-gray-300 leading-relaxed">
                                    {paragraph}
                                </p>
                            );
                        })}
                    </div>

                    {/* Source Attribution */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Sources: {article.originalSource || 'Global Brief Wires'}
                        </p>
                        {article.source && (
                            <a
                                href={article.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                            >
                                View original source →
                            </a>
                        )}
                    </div>

                </div>
            </div>
        </article>
    );
}

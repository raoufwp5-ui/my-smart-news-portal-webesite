'use client';

/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Calendar, ExternalLink, ArrowRight } from 'lucide-react';
import { useState } from 'react';

export default function NewsCard({ article }) {
    const [isExpanded, setIsExpanded] = useState(false);

    // If article wasn't rewritten correctly, fallback to defaults
    const {
        title = "News Article",
        tldr = ["Analysis in progress..."],
        content = "Read full story at source.",
        image = null,
        date = new Date().toISOString(),
        source = "#",
        originalSource = "Unknown"
    } = article || {};

    const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = '/default-news.jpg';
    };

    const productionUrl = 'https://my-smart-news-portal-webesite.vercel.app';

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full group">
            <Link href={`/article/${slug}`} className="block relative aspect-video overflow-hidden">
                <img
                    src={article.image || '/default-news.jpg'}
                    alt={article.title}
                    onError={handleImageError}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-tight">
                    {article.originalSource || 'Global News'}
                </div>
            </Link>

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full uppercase tracking-wider">
                        {new Date(article.pubDate || article.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <Link href={`/article/${slug}`} className="group-hover:text-red-600 transition-colors">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                        {article.title}
                    </h2>
                </Link>

                <div className="flex-grow mb-4">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 text-sm">
                        {Array.isArray(tldr) ? tldr[0] : tldr}
                    </p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <Link
                        href={`/article/${slug}`}
                        className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 flex items-center gap-1 transition-all group/link"
                    >
                        Read Full Story <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'NewsArticle',
                        headline: title,
                        image: [image || `${productionUrl}/default-news.jpg`],
                        datePublished: date,
                        dateModified: new Date().toISOString(),
                        author: [{
                            '@type': 'Organization',
                            name: 'Global Brief Staff',
                            url: productionUrl
                        }],
                        publisher: {
                            '@type': 'Organization',
                            name: 'Global Brief',
                            logo: {
                                '@type': 'ImageObject',
                                url: `${productionUrl}/logo.png`
                            }
                        },
                        description: article.tldr ? article.tldr[0] : article.title || content.substring(0, 150)
                    })
                }}
            />
        </div>
    );
}

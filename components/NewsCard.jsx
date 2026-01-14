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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full group">
            <Link href={`/article/${slug}`} className="block relative aspect-video overflow-hidden">
                <img
                    src={article.image || '/default-news.jpg'}
                    alt={article.title}
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                    {article.originalSource}
                </div>
            </Link>

            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full uppercase tracking-wider">
                        {new Date(article.pubDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                </div>

                <Link href={`/article/${slug}`} className="group-hover:text-blue-600 transition-colors">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 leading-tight">
                        {article.title}
                    </h2>
                </Link>

                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2">TL;DR</h3>
                    <ul className="space-y-1">
                        {Array.isArray(tldr) ? tldr.map((point, i) => (
                            <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex items-start">
                                <span className="mr-2 text-blue-500">•</span>
                                {point}
                            </li>
                        )) : <li className="text-sm text-gray-700 dark:text-gray-300">{tldr}</li>}
                    </ul>
                </div>

                <div className="flex-grow">
                    <p className={`text-gray-600 dark:text-gray-400 leading-relaxed ${!isExpanded ? 'line-clamp-3' : ''}`}>
                        {content}
                    </p>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <Link
                        href={`/article/${slug}`}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
                    >
                        Read Full Story <ArrowRight size={16} />
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
                        image: [image || 'https://globalbrief.vercel.app/default-news.jpg'],
                        datePublished: date,
                        dateModified: new Date().toISOString(),
                        author: [{
                            '@type': 'Organization',
                            name: 'Global Brief Staff',
                            url: 'https://globalbrief.vercel.app'
                        }],
                        publisher: {
                            '@type': 'Organization',
                            name: 'Global Brief',
                            logo: {
                                '@type': 'ImageObject',
                                url: 'https://globalbrief.vercel.app/logo.png'
                            }
                        },
                        description: article.tldr ? article.tldr[0] : article.title || content.substring(0, 150)
                    })
                }}
            />
        </div>
    );
}

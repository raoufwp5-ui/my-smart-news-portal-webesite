/* eslint-disable @next/next/no-img-element */
import { Calendar, ExternalLink } from 'lucide-react';
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

    return (
        <div className="group bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full">
            <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                {image ? (
                    <img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">📰</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full uppercase tracking-wider">
                    {originalSource}
                </div>
            </div>

            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-center text-sm text-gray-500 mb-3 space-x-4">
                    <span className="flex items-center"><Calendar size={14} className="mr-1" /> {new Date(date).toLocaleDateString()}</span>
                </div>

                <h2 className="text-xl font-bold mb-4 line-clamp-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {title}
                </h2>

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

                <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                        {isExpanded ? 'Show Less' : 'Read Analysis'}
                    </button>

                    <a
                        href={source}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        Source <ExternalLink size={14} className="ml-1" />
                    </a>
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
                        image: [image || 'https://ai-news-website.vercel.app/default-news.jpg'],
                        datePublished: date,
                        dateModified: new Date().toISOString(),
                        author: [{
                            '@type': 'Organization',
                            name: 'AI News Agent',
                            url: 'https://ai-news-website.vercel.app'
                        }],
                        publisher: {
                            '@type': 'Organization',
                            name: 'AI News Daily',
                            logo: {
                                '@type': 'ImageObject',
                                url: 'https://ai-news-website.vercel.app/logo.png'
                            }
                        },
                        description: tldr[0] || content.substring(0, 150)
                    })
                }}
            />
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import NewsCard from '@/components/NewsCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import AdSlot from '@/components/AdSlot';
import HeroNews from '@/components/HeroNews';

export default function NewsFeed({ category }) {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ pages: 1, total: 0 });

    useEffect(() => {
        async function fetchNews() {
            setLoading(true);
            try {
                const res = await fetch(`/api/generate-news?category=${category}&page=${page}`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const data = await res.json();
                setNews(data.articles || []);
                setPagination(data.pagination || { pages: 1, total: data.articles?.length || 0 });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchNews();
    }, [category, page]);

    if (error) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-200">Something went wrong</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    Retry Connection
                </button>
            </div>
        );
    }

    // Hero only on page 1 of 'general'
    const heroArticle = category === 'general' && page === 1 && news.length > 0 ? news[0] : null;
    const gridArticles = heroArticle ? news.slice(1) : news;

    return (
        <div>
            {/* Hero Section */}
            {loading && page === 1 && category === 'general' ? (
                <div className="h-[500px] bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse mb-12"></div>
            ) : (
                heroArticle && <HeroNews article={heroArticle} />
            )}

            {!loading && <AdSlot position="Top Banner" />}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 my-12">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <SkeletonLoader key={i} />)
                ) : gridArticles.length > 0 ? (
                    gridArticles.map((article, index) => (
                        <div key={index} className="contents">
                            <NewsCard article={article} />
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                        <div className="text-5xl mb-4">📰</div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No news found</h3>
                        <p className="text-gray-600 dark:text-gray-400">Please check back shortly.</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {!loading && pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 mb-20">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                        <button
                            key={p}
                            onClick={() => {
                                setPage(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className={`w-10 h-10 rounded-full font-bold transition-all ${page === p
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            )}

            <AdSlot position="Bottom Banner" />
        </div>
    );
}

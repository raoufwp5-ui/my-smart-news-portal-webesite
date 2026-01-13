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

    useEffect(() => {
        async function fetchNews() {
            setLoading(true);
            try {
                const res = await fetch(`/api/generate-news?category=${category}`);
                if (!res.ok) throw new Error('Failed to fetch data');
                const data = await res.json();
                setNews(data.articles || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchNews();
    }, [category]);

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

    // Display first article as Hero only on 'General'/Home category for impact
    const heroArticle = category === 'general' && news.length > 0 ? news[0] : null;
    const gridArticles = category === 'general' ? news.slice(1) : news;

    return (
        <div>
            {/* Hero Section */}
            {loading && category === 'general' ? (
                <div className="h-[500px] bg-gray-200 dark:bg-gray-800 rounded-3xl animate-pulse mb-12"></div>
            ) : (
                heroArticle && <HeroNews article={heroArticle} />
            )}

            {/* Ad before grid */}
            {!loading && <AdSlot position="Top Banner" />}

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 my-12">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <SkeletonLoader key={i} />)
                ) : (
                    gridArticles.map((article, index) => (
                        <div key={index} className="contents">
                            {/* Logic for inserting ads within grid items would require fragmenting the grid, 
                   instead simplify by placing ads full width between rows or using css grid logic.
                   For simplicity here, we'll keep the cleaner grid and just use bottom/top ads 
                   to maintain design integrity, or use specific positions. 
               */}
                            <NewsCard article={article} />

                            {/* Inject responsive ad after 2nd item on mobile, or based on index */}
                        </div>
                    ))
                )}
            </div>

            <AdSlot position="Bottom Banner" />
        </div>
    );
}

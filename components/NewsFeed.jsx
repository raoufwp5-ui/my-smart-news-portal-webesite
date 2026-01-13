'use client';

import { useState, useEffect } from 'react';
import NewsCard from '@/components/NewsCard';
import SkeletonLoader from '@/components/SkeletonLoader';
import AdSlot from '@/components/AdSlot';

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
            <div className="text-center py-20 text-red-500">
                <h2 className="text-2xl font-bold mb-2">Oops! Something went wrong.</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-100 rounded text-red-600">Try Again</button>
            </div>
        );
    }

    return (
        <div>
            <AdSlot position="Top Banner" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
                {loading ? (
                    // Show 6 skeletons while loading
                    Array(6).fill(0).map((_, i) => <SkeletonLoader key={i} />)
                ) : (
                    news.map((article, index) => (
                        <div key={index}>
                            {/* Insert Ad after every 3rd article */}
                            {index > 0 && index % 3 === 0 && <div className="col-span-1 md:col-span-2 lg:col-span-3 mb-6"><AdSlot position="In-Feed" /></div>}
                            <NewsCard article={article} />
                        </div>
                    ))
                )}
            </div>

            <AdSlot position="Bottom Banner" />
        </div>
    );
}

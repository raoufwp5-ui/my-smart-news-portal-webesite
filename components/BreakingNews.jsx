'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function BreakingNews() {
    const [news, setNews] = useState([]);

    useEffect(() => {
        fetch('/api/latest-news')
            .then(res => res.json())
            .then(data => setNews(data.articles || []))
            .catch(err => console.error(err));
    }, []);

    if (news.length === 0) return null;

    return (
        <div className="bg-red-700 text-white text-sm font-semibold border-b border-red-800">
            <div className="container mx-auto px-4 flex items-center h-10">
                <span className="flex items-center gap-2 bg-red-800 px-3 py-1 rounded text-xs uppercase tracking-widest mr-4 shrink-0 animate-pulse">
                    <AlertCircle size={14} /> Breaking
                </span>
                <div className="flex-grow overflow-hidden relative">
                    <div className="animate-marquee whitespace-nowrap flex gap-8 items-center">
                        {news.map((item, i) => (
                            <Link key={i} href={`/article/${item.slug}`} className="hover:underline opacity-90 hover:opacity-100 transition-opacity">
                                {item.title}  <span className="mx-2 text-red-400">•</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

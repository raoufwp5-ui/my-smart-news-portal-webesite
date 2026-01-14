'use client';

import { AlertCircle } from 'lucide-react';

export function SafeImage({ src, alt, className, style }) {
    const fallback = '/default-news.jpg';
    return (
        <img
            src={src || fallback}
            alt={alt}
            className={className}
            style={style}
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallback;
            }}
        />
    );
}

export function VideoPlayer({ url }) {
    if (!url) return null;
    return (
        <div className="mb-12 aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border-4 border-gray-100 dark:border-gray-800">
            <iframe
                src={url}
                className="w-full h-full"
                allowFullScreen
                title="Video Content"
            />
        </div>
    );
}

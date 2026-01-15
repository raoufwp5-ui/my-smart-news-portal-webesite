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

    // Helper to extract Video ID and return Embed URL
    const getEmbedUrl = (rawUrl) => {
        try {
            // Handle YouTube
            if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
                let videoId = null;

                if (rawUrl.includes('v=')) {
                    videoId = rawUrl.split('v=')[1].split('&')[0];
                } else if (rawUrl.includes('youtu.be/')) {
                    videoId = rawUrl.split('youtu.be/')[1].split('?')[0];
                } else if (rawUrl.includes('/embed/')) {
                    return rawUrl; // Already good
                }

                if (videoId) {
                    // origin is crucial for some restricteds videos
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&origin=${origin}`;
                }
            }
            // Add other providers (Vimeo, etc) here if needed

            return rawUrl; // Return original if no match (hope for the best)
        } catch (e) {
            return rawUrl;
        }
    };

    const finalUrl = getEmbedUrl(url);

    return (
        <div className="mb-12 aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border-4 border-gray-100 dark:border-gray-800">
            <iframe
                src={finalUrl}
                className="w-full h-full"
                allowFullScreen
                title="Video Content"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
        </div>
    );
}

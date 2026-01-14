'use client';

import { Facebook, Twitter, Link as LinkIcon, Share2 } from 'lucide-react';
import { useState } from 'react';

export default function SocialShare({ title, slug }) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/article/${slug}` : `https://global-brief-news.vercel.app/article/${slug}`;
    const [copied, setCopied] = useState(false);

    const share = (platform) => {
        let link = '';
        switch (platform) {
            case 'twitter':
                link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                link = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
                break;
        }
        if (link) window.open(link, '_blank', 'width=600,height=400');
    };

    const copyLink = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 my-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Share2 size={16} /> Share
            </span>
            <div className="flex gap-2">
                <button onClick={() => share('twitter')} className="p-2 bg-gray-100 hover:bg-black hover:text-white rounded-full transition-colors dark:bg-gray-800 dark:hover:bg-white dark:hover:text-black">
                    <Twitter size={18} />
                </button>
                <button onClick={() => share('facebook')} className="p-2 bg-gray-100 hover:bg-blue-600 hover:text-white rounded-full transition-colors dark:bg-gray-800">
                    <Facebook size={18} />
                </button>
                {/* WhatsApp Generic Icon? Lucide doesn't have MessageCircle? It does. Using Twitter as placeholder or MessageCircle if available. Assuming Lucide standard. */}
                <button onClick={() => share('whatsapp')} className="p-2 bg-gray-100 hover:bg-green-500 hover:text-white rounded-full transition-colors dark:bg-gray-800">
                    <span className="font-bold text-xs">WA</span>
                </button>
                <button onClick={copyLink} className="p-2 bg-gray-100 hover:bg-gray-600 hover:text-white rounded-full transition-colors dark:bg-gray-800 relative">
                    <LinkIcon size={18} />
                    {copied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded">Copied!</span>}
                </button>
            </div>
        </div>
    );
}

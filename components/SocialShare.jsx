'use client';

import { Facebook, Twitter, Linkedin, Link as LinkIcon, Share2, Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function SocialShare({ title, slug, variant = 'horizontal' }) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/article/${slug}` : `https://global-brief.vercel.app/article/${slug}`;
    const [copied, setCopied] = useState(false);

    const share = (platform) => {
        let link = '';
        const text = `${title} ${url}`;

        switch (platform) {
            case 'twitter':
                link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
                break;
            case 'facebook':
                link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'linkedin':
                link = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            case 'whatsapp':
                link = `https://wa.me/?text=${encodeURIComponent(text)}`;
                break;
            case 'telegram':
                link = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
                break;
        }
        if (link) window.open(link, '_blank', 'width=600,height=400');
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: title,
                    url: url,
                });
            } catch (err) {
                console.log('Share canceled');
            }
        } else {
            copyLink();
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isVertical = variant === 'vertical';

    const containerClass = isVertical
        ? "flex flex-col gap-4 fixed right-8 top-1/3 z-50 hidden xl:flex"
        : "flex items-center gap-2 my-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex-wrap";

    const buttonClass = (colorClass) => `
        p-3 rounded-full transition-all duration-300 shadow-lg hover:-translate-y-1 relative group
        ${isVertical ? 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-white' : 'bg-gray-100 dark:bg-gray-800 hover:text-white'}
        ${colorClass}
    `;

    return (
        <div className={containerClass}>
            {!isVertical && (
                <span className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 mr-4">
                    <Share2 size={16} /> Share
                </span>
            )}

            {/* WhatsApp */}
            <button onClick={() => share('whatsapp')} className={buttonClass('hover:bg-[#25D366]')} aria-label="Share on WhatsApp">
                <MessageCircle size={20} />
            </button>

            {/* LinkedIn */}
            <button onClick={() => share('linkedin')} className={buttonClass('hover:bg-[#0077b5]')} aria-label="Share on LinkedIn">
                <Linkedin size={20} />
            </button>

            {/* X / Twitter */}
            <button onClick={() => share('twitter')} className={buttonClass('hover:bg-black dark:hover:bg-white dark:hover:text-black')} aria-label="Share on X">
                <Twitter size={20} />
            </button>

            {/* Telegram */}
            <button onClick={() => share('telegram')} className={buttonClass('hover:bg-[#0088cc]')} aria-label="Share on Telegram">
                <Send size={20} />
            </button>

            {/* Facebook */}
            <button onClick={() => share('facebook')} className={buttonClass('hover:bg-[#1877F2]')} aria-label="Share on Facebook">
                <Facebook size={20} />
            </button>

            {/* Native Share / Copy */}
            <button onClick={handleNativeShare} className={buttonClass('hover:bg-red-600')} aria-label="Copy Link">
                {copied ? <span className="font-bold text-xs">OK</span> : <LinkIcon size={20} />}
                {isVertical && <span className="absolute left-full ml-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Copy Link</span>}
            </button>
        </div>
    );
}

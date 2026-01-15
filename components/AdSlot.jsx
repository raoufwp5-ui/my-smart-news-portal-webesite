'use client';

import { useEffect, useRef } from 'react';

export default function AdSlot({
    adSlot,
    adFormat = "auto",
    fullWidthResponsive = "true",
    className = "",
    label = "Advertisement"
}) {
    const adRef = useRef(null);
    const hasRun = useRef(false);

    // Hardcoded for now or use env var
    const PUB_ID = "ca-pub-XXXXXXXXXXXXXXXX";

    useEffect(() => {
        if (hasRun.current) return;

        try {
            if (typeof window !== 'undefined' && window.adsbygoogle) {
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                hasRun.current = true;
            }
        } catch (e) {
            console.error("AdSense Error:", e);
        }
    }, []);

    // Placeholder for Dev/No-ID
    if (PUB_ID.includes('XXX')) {
        return (
            <div className={`flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg mx-auto ${className}`}>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</span>
                <span className="text-gray-500 font-medium">AdSpace: {adFormat}</span>
            </div>
        );
    }

    return (
        <div className={`text-center my-8 ${className}`}>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Advertisement</span>
            <div ref={adRef} className="overflow-hidden">
                <ins className="adsbygoogle"
                    style={{ display: 'block' }}
                    data-ad-client={PUB_ID}
                    data-ad-slot={adSlot}
                    data-ad-format={adFormat}
                    data-full-width-responsive={fullWidthResponsive}></ins>
            </div>
        </div>
    );
}

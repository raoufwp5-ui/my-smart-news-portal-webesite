import { getAllArticles } from '@/lib/articleStore';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const baseUrl = 'https://global-brief.vercel.app';
    const { articles } = await getAllArticles(1, 1000);

    const now = new Date();
    // 3 Days window to be safe
    const threeDaysAgo = new Date(now.getTime() - (72 * 60 * 60 * 1000));
    const futureBuffer = new Date(now.getTime() + (2 * 60 * 60 * 1000));

    const recentArticles = articles
        .filter(article => {
            if (article.status && article.status !== 'published') return false;

            const dateStr = article.pubDate || article.date || article.savedAt;
            if (!dateStr) return false;

            const pubDate = new Date(dateStr);
            if (isNaN(pubDate.getTime())) return false;

            return pubDate > threeDaysAgo && pubDate <= futureBuffer;
        })
        .sort((a, b) => {
            const dateA = new Date(a.pubDate || a.date || a.savedAt);
            const dateB = new Date(b.pubDate || b.date || b.savedAt);
            return dateB - dateA;
        });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recentArticles.map(article => `<url>
<loc>${baseUrl}/article/${article.slug}</loc>
<news:news>
<news:publication>
<news:name>Global Brief</news:name>
<news:language>en</news:language>
</news:publication>
<news:publication_date>${new Date(article.pubDate || article.date || article.savedAt).toISOString()}</news:publication_date>
<news:title>${(article.title || 'Untitled').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</news:title>
</news:news>
</url>`).join('')}
</urlset>`.trim();

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Content-Type-Options': 'nosniff'
        },
    });
}

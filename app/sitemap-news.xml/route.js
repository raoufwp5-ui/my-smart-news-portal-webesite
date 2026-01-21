import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const baseUrl = 'https://global-brief.vercel.app';

    // HARDCODED VALID DATA FOR DEBUGGING
    // Use a real article slug that we know exists
    const hardcodedArticle = {
        slug: 'tokyo-vertical-farm-first-crop-2026',
        title: "Feeding the World: Tokyo's 100-Story Vertical Farm Harvests First Crop",
        pubDate: "2026-01-20T22:00:00.000Z"
    };

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    <url>
        <loc>${baseUrl}/article/${hardcodedArticle.slug}</loc>
        <news:news>
            <news:publication>
                <news:name>Global Brief</news:name>
                <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${hardcodedArticle.pubDate}</news:publication_date>
            <news:title>${hardcodedArticle.title}</news:title>
        </news:news>
    </url>
</urlset>`.trim();

    return new NextResponse(xml, {
        status: 200,
        headers: {
            'Content-Type': 'text/xml; charset=utf-8', // Changed to text/xml for broader compatibility check
            'Cache-Control': 'no-store, max-age=0',
            'X-Content-Type-Options': 'nosniff'
        },
    });
}

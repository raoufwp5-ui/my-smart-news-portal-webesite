import { getAllArticles } from '@/lib/articleStore';

export const dynamic = 'force-dynamic';

export async function GET() {
    const baseUrl = 'https://global-brief.vercel.app';
    const categories = ['business', 'technology', 'politics', 'sports', 'general'];
    const articles = await getAllArticles();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>${baseUrl}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>always</changefreq>
        <priority>1.0</priority>
    </url>
    ${categories.map(cat => `
    <url>
        <loc>${baseUrl}/${cat}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>hourly</changefreq>
        <priority>0.9</priority>
    </url>
    `).join('')}
    ${articles.map(article => `
    <url>
        <loc>${baseUrl}/article/${article.slug}</loc>
        <lastmod>${new Date(article.pubDate || article.date || new Date()).toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
    </url>
    `).join('')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        },
    });
}

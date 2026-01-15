import { getAllArticles } from '@/lib/articleStore';

export const dynamic = 'force-dynamic';

export async function GET() {
    const baseUrl = 'https://global-brief.vercel.app';
    const { articles } = await getAllArticles(1, 1000);

    // Filter articles from the last 48 hours
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));

    const recentArticles = articles.filter(article => {
        const pubDate = new Date(article.pubDate || article.date);
        return pubDate > twoDaysAgo;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
    ${recentArticles.map(article => `
    <url>
        <loc>${baseUrl}/article/${article.slug}</loc>
        <news:news>
            <news:publication>
                <news:name>Global Brief</news:name>
                <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${new Date(article.pubDate || article.date).toISOString()}</news:publication_date>
            <news:title>${article.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</news:title>
        </news:news>
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

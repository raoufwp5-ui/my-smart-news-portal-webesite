import { getAllArticles } from '@/lib/articleStore';

export const dynamic = 'force-dynamic';

export async function GET() {
    const baseUrl = 'https://global-brief.vercel.app';
    const { articles } = await getAllArticles(1, 1000);

    // Filter articles from the last 48 hours for Google News compliance
    // We use a slightly larger window (3 days) to be safe against timezone differences, 
    // but strictly Google News only indexes the last 2 days.
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - (72 * 60 * 60 * 1000));
    const futureBuffer = new Date(now.getTime() + (2 * 60 * 60 * 1000)); // Allow 2 hours future clock skew

    const recentArticles = articles
        .filter(article => {
            // 1. Status Check: Must be published (or missing status which implies published for legacy)
            if (article.status && article.status !== 'published') return false;

            // 2. Date Parsing
            const dateStr = article.pubDate || article.date || article.savedAt;
            if (!dateStr) return false;

            const pubDate = new Date(dateStr);
            if (isNaN(pubDate.getTime())) return false;

            // 3. Date Window Check
            return pubDate > threeDaysAgo && pubDate <= futureBuffer;
        })
        .sort((a, b) => {
            // Sort by publish date, newest first
            const dateA = new Date(a.pubDate || a.date || a.savedAt);
            const dateB = new Date(b.pubDate || b.date || b.savedAt);
            return dateB - dateA;
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
            <news:publication_date>${new Date(article.pubDate || article.date || article.savedAt).toISOString()}</news:publication_date>
            <news:title>${(article.title || 'Untitled').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</news:title>
        </news:news>
    </url>
    `).join('')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        },
    });
}

import { getAllArticles } from '@/lib/articleStore';

export async function GET() {
    const { articles } = await getAllArticles(1, 100);
    const baseUrl = 'https://global-brief.vercel.app';
    const now = new Date();

    // Filter out future posts if you want strict RSS compliance, 
    // or keep them if you want RSS to show upcoming content (usually standard is to show published).
    // Let's stick to published (past/present) to match the News Sitemap logic for safety.
    const publishedArticles = articles.filter(article => {
        const pubDate = new Date(article.pubDate || article.date);
        return pubDate <= now;
    });

    const itemsXml = publishedArticles.map(article => {
        const articleUrl = `${baseUrl}/article/${article.slug}`;
        const pubDate = new Date(article.pubDate || article.date).toUTCString();

        // Ensure image URL is absolute
        let imageUrl = article.image || '';
        if (imageUrl && !imageUrl.startsWith('http')) {
            imageUrl = `${baseUrl}${imageUrl}`;
        }

        return `
        <item>
            <title><![CDATA[${article.title}]]></title>
            <link>${articleUrl}</link>
            <guid isPermaLink="true">${articleUrl}</guid>
            <pubDate>${pubDate}</pubDate>
            <description><![CDATA[${article.tldr ? article.tldr[0] : article.metaDescription || ''}]]></description>
            ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ''}
            <category>${article.category || 'News'}</category>
        </item>`;
    }).join('');

    const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
    <channel>
        <title>Global Brief - World News &amp; Intelligence</title>
        <link>${baseUrl}</link>
        <description>Premium reporting on business, technology, politics, and sports.</description>
        <language>en-us</language>
        <lastBuildDate>${now.toUTCString()}</lastBuildDate>
        <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
        ${itemsXml}
    </channel>
</rss>`;

    return new Response(rssXml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 's-maxage=3600, stale-while-revalidate',
        },
    });
}

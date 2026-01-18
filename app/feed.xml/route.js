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

    // We need to read the full content for Flipboard/RSS compliance (300 words)
    // Since getAllArticles only gives us index data, we'll fetch individual files here. 
    // Optimization: Only do this for the latest 20 items to avoid file I/O explosion.

    const importFs = await import('fs');
    const importPath = await import('path');
    const articlesDir = importPath.default.join(process.cwd(), 'data', 'articles');

    const itemsXml = publishedArticles.slice(0, 20).map(article => {
        const articleUrl = `${baseUrl}/article/${article.slug}`;
        const pubDate = new Date(article.pubDate || article.date).toUTCString();

        // 1. Fetch Full Content from Disk
        let description = article.tldr ? article.tldr[0] : (article.metaDescription || '');
        try {
            const filePath = importPath.default.join(articlesDir, `${article.slug}.json`);
            if (importFs.default.existsSync(filePath)) {
                const fullData = JSON.parse(importFs.default.readFileSync(filePath, 'utf8'));
                if (fullData.content) {
                    // 2. Strip Markdown & Truncate
                    let cleanText = fullData.content
                        .replace(/#{1,6}\s?/g, '') // Remove Headers
                        .replace(/(\*\*|__)(.*?)\1/g, '$2') // Remove Bold
                        .replace(/(\*|_)(.*?)\1/g, '$2') // Remove Italic
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove Links
                        .replace(/!\[[^\]]*\]\([^)]+\)/g, '') // Remove Images
                        .replace(/>\s?/g, '') // Remove Blockquotes
                        .replace(/`{1,3}[^`]*`{1,3}/g, '') // Remove Code
                        .replace(/\n+/g, ' ') // Collapse newlines
                        .trim();

                    // Get first 60 words for standard description, but Flipboard might want more.
                    // User requested ~300 words.
                    const words = cleanText.split(/\s+/);
                    if (words.length > 50) {
                        description = words.slice(0, 300).join(' ') + '...';
                    }
                }
            }
        } catch (e) {
            // Fallback to basic description
        }

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
            <description><![CDATA[${description} <br/><a href="${articleUrl}">Read full article at Global Brief</a>]]></description>
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

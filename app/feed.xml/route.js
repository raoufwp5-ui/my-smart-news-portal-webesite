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

        // 1. Fetch Full Content from Disk for Long Excerpt
        let longExcerpt = '';
        let shortSummary = article.metaDescription || (article.tldr ? article.tldr[0] : '');

        try {
            const filePath = importPath.default.join(articlesDir, `${article.slug}.json`);
            if (importFs.default.existsSync(filePath)) {
                const fullData = JSON.parse(importFs.default.readFileSync(filePath, 'utf8'));
                if (fullData.content) {
                    // Strip Markdown & Truncate
                    let cleanText = fullData.content
                        .replace(/#{1,6}\s?/g, '')
                        .replace(/(\*\*|__)(.*?)\1/g, '$2')
                        .replace(/(\*|_)(.*?)\1/g, '$2')
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
                        .replace(/>\s?/g, '')
                        .replace(/`{1,3}[^`]*`{1,3}/g, '')
                        .replace(/\n+/g, ' ')
                        .trim();

                    const words = cleanText.split(/\s+/);
                    if (words.length > 50) {
                        longExcerpt = words.slice(0, 300).join(' ') + '...';
                    } else {
                        longExcerpt = cleanText;
                    }
                }
            }
        } catch (e) { }

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
            <description><![CDATA[${shortSummary}]]></description>
            <content:encoded><![CDATA[
                ${imageUrl ? `<img src="${imageUrl}" alt="${article.title}" style="width:100%; max-width:600px; margin-bottom:20px;" />` : ''}
                <p>${longExcerpt}</p>
                <br/>
                <p><a href="${articleUrl}">Read the full story at Global Brief</a></p>
            ]]></content:encoded>
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

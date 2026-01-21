import fs from 'fs';
import path from 'path';

export default async function sitemap() {
    const baseUrl = 'https://global-brief.vercel.app';
    const currentDate = new Date().toISOString();

    // 1. Static Routes
    const staticRoutes = [
        {
            url: baseUrl,
            lastModified: currentDate,
            changeFrequency: 'hourly',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/about`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: currentDate,
            changeFrequency: 'monthly',
            priority: 0.6,
        },
        {
            url: `${baseUrl}/privacy-policy`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/terms`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${baseUrl}/editorial-policy`,
            lastModified: currentDate,
            changeFrequency: 'yearly',
            priority: 0.4,
        },
        {
            url: `${baseUrl}/authors`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.7,
        },
    ];

    // 2. Category Routes
    const categories = ['technology', 'business', 'sports', 'politics', 'health', 'science', 'economy', 'environment'];
    const categoryRoutes = categories.map((category) => ({
        url: `${baseUrl}/${category}`,
        lastModified: currentDate,
        changeFrequency: 'daily',
        priority: 0.8,
    }));

    // 3. Dynamic Articles (from Index)
    let articleRoutes = [];
    try {
        const indexContent = fs.readFileSync(path.join(process.cwd(), 'data/articles-index.json'), 'utf8');
        const index = JSON.parse(indexContent);

        articleRoutes = index.articles.map((article) => ({
            url: `${baseUrl}/article/${article.slug}`,
            lastModified: article.pubDate || article.savedAt || currentDate,
            changeFrequency: 'daily',
            priority: 0.9,
        }));
    } catch (e) {
        console.error('Sitemap Error (Articles):', e);
    }

    // 4. Dynamic Authors
    let authorRoutes = [];
    try {
        const authorsContent = fs.readFileSync(path.join(process.cwd(), 'data/authors.json'), 'utf8');
        const authors = JSON.parse(authorsContent);

        authorRoutes = authors.map((author) => ({
            url: `${baseUrl}/author/${author.id}`,
            lastModified: currentDate,
            changeFrequency: 'weekly',
            priority: 0.7,
        }));
    } catch (e) {
        console.error('Sitemap Error (Authors):', e);
    }

    return [...staticRoutes, ...categoryRoutes, ...articleRoutes, ...authorRoutes];
}

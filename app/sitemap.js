import { getAllArticles } from '@/lib/articleStore';

export default async function sitemap() {
    const baseUrl = 'https://my-smart-news-portal-webesite.vercel.app';
    const categories = ['business', 'technology', 'politics', 'sports', 'general'];

    // 1. Static Category Pages
    const categoryUrls = categories.map((cat) => ({
        url: `${baseUrl}/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.9,
    }));

    // 2. Dynamic Article Pages
    const articles = await getAllArticles();
    const articleUrls = articles.map((article) => ({
        url: `${baseUrl}/article/${article.slug}`,
        lastModified: new Date(article.pubDate || new Date()),
        changeFrequency: 'daily',
        priority: 0.7,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1,
        },
        ...categoryUrls,
        ...articleUrls,
    ];
}

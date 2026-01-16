
import { getAllArticles } from '../lib/articleStore.js';

async function testSitemap() {
    console.log("Starting sitemap generation test...");
    try {
        const { articles } = await getAllArticles(1, 1000);
        console.log(`Fetched ${articles.length} articles.`);

        const baseUrl = 'https://global-brief.vercel.app';
        const categories = ['business', 'technology', 'politics', 'sports', 'general'];

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

        console.log("Sitemap generated successfully!");
        console.log("Length:", xml.length);
        console.log("First 500 chars:", xml.substring(0, 500));
    } catch (error) {
        console.error("Error generating sitemap:", error);
    }
}

testSitemap();

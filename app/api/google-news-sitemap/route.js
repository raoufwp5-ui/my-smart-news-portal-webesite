import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const baseUrl = 'https://ai-news-website.vercel.app';

  // Aggregate all articles from all feeds
  let allArticles = [];

  for (const [category, url] of Object.entries(FEEDS)) {
    try {
      if (category === 'general') continue; // Skip general if it duplicates others
      const feed = await fetchFeed(url);
      if (feed && feed.items) {
        const categoryArticles = feed.items.slice(0, 5).map(item => ({
          ...item,
          category
        }));
        allArticles = [...allArticles, ...categoryArticles];
      }
    } catch (e) {
      console.error(`Error fetching ${category} for sitemap`, e);
    }
  }

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
      ${allArticles.map(article => `
        <url>
          <loc>${baseUrl}/${article.category}#${encodeURIComponent(article.title)}</loc>
          <news:news>
            <news:publication>
              <news:name>AI News Daily</news:name>
              <news:language>en</news:language>
            </news:publication>
            <news:publication_date>${new Date(article.pubDate).toISOString()}</news:publication_date>
            <news:title>${article.title.replace(/&/g, '&amp;')}</news:title>
          </news:news>
        </url>
      `).join('')}
    </urlset>
  `;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

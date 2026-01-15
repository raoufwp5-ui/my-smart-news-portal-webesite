import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        let category = searchParams.get('category');
        const limit = parseInt(searchParams.get('limit') || '10');
        const page = parseInt(searchParams.get('page') || '1');

        // Handle "all", "general", or empty category
        if (category === 'all' || category === 'general' || category === 'undefined' || category === 'null') {
            category = null;
        }

        const indexFile = path.join(process.cwd(), 'data', 'articles-index.json');
        if (!fs.existsSync(indexFile)) {
            return NextResponse.json({ articles: [], pagination: { pages: 0, total: 0 } });
        }

        const data = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
        let articles = data.articles;

        // 1. Filter by Category (Case Insensitive)
        if (category) {
            articles = articles.filter(a => a.category.toLowerCase() === category.toLowerCase());
        }

        // 2. Sort by Date (Newest First)
        articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        // 3. Pagination
        const total = articles.length;
        const totalPages = Math.ceil(total / limit);
        const offset = (page - 1) * limit;
        const paginatedArticles = articles.slice(offset, offset + limit);

        // Map to lightweight structure
        const responseArticles = paginatedArticles.map(a => ({
            title: a.title,
            slug: a.slug,
            image: a.image,
            category: a.category,
            pubDate: a.pubDate,
            tldr: a.tldr || [],
            source: a.source || 'Global Brief',
            originalSource: a.originalSource || 'Global Brief AI'
        }));

        return NextResponse.json({
            articles: responseArticles,
            pagination: {
                page,
                limit,
                total,
                pages: totalPages
            }
        });

    } catch (e) {
        console.error('API Error:', e);
        return NextResponse.json({ articles: [], pagination: { pages: 0, total: 0 } }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const indexFile = path.join(process.cwd(), 'data', 'articles-index.json');
        if (!fs.existsSync(indexFile)) {
            return NextResponse.json({ articles: [] });
        }

        const data = JSON.parse(fs.readFileSync(indexFile, 'utf-8'));
        // Get 5 most recent articles
        const latest = data.articles
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, 5)
            .map(a => ({ title: a.title, slug: a.slug }));

        return NextResponse.json({ articles: latest });
    } catch (e) {
        return NextResponse.json({ articles: [] }, { status: 500 });
    }
}

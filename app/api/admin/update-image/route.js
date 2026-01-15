
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { rebuildIndex } from '@/lib/articleStore';

export async function POST(request) {
    try {
        const { slug, imageUrl } = await request.json();

        if (!slug || !imageUrl) {
            return NextResponse.json({ error: 'Missing slug or imageUrl' }, { status: 400 });
        }

        const articlesDir = path.join(process.cwd(), 'data', 'articles');
        const filePath = path.join(articlesDir, `${slug}.json`);

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Read, Update, Write
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const article = JSON.parse(fileContent);

        article.image = imageUrl;
        article.isCustomImage = true; // The "Blue Check" flag ✅

        fs.writeFileSync(filePath, JSON.stringify(article, null, 2));

        // Important: Rebuild the index so the frontend sees the change immediately
        rebuildIndex();

        return NextResponse.json({ success: true, article });

    } catch (error) {
        console.error('Admin Update Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

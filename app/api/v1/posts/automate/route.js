import { NextResponse } from 'next/server';
import { saveArticle, generateSlug, rebuildIndex } from '@/lib/articleStore';
import { revalidatePath } from 'next/cache';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

/**
 * Activepieces API Endpoint for Automated Article Posting
 * POST /api/v1/posts/automate
 * 
 * Headers: X-API-KEY (required)
 * Body: { title, content, image, category }
 */

// Download image from URL
async function downloadImage(imageUrl, slug) {
    return new Promise((resolve, reject) => {
        const ext = path.extname(new URL(imageUrl).pathname) || '.jpg';
        const filename = `${slug}${ext}`;
        const filepath = path.join(process.cwd(), 'public', 'media', 'articles', filename);

        // Ensure directory exists
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const protocol = imageUrl.startsWith('https') ? https : http;
        const file = fs.createWriteStream(filepath);

        protocol.get(imageUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download image: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(`/media/articles/${filename}`);
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });

        file.on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

export async function POST(request) {
    try {
        // 1. Authentication
        const apiKey = request.headers.get('X-API-KEY');
        const validKey = process.env.AUTOMATION_API_KEY;

        if (!validKey) {
            console.error('❌ AUTOMATION_API_KEY not configured in environment');
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        if (!apiKey || apiKey !== validKey) {
            return NextResponse.json(
                { error: 'Unauthorized: Invalid API key' },
                { status: 401 }
            );
        }

        // 2. Parse and validate input
        const body = await request.json();
        const { title, content, image, category } = body;

        if (!title || !content || !category) {
            return NextResponse.json(
                { error: 'Missing required fields: title, content, category' },
                { status: 400 }
            );
        }

        // Validate category
        const validCategories = ['business', 'technology', 'politics', 'sports', 'general', 'health', 'science', 'auto', 'environment'];
        if (!validCategories.includes(category.toLowerCase())) {
            return NextResponse.json(
                { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
                { status: 400 }
            );
        }

        // 3. Generate slug and prepare article
        const slug = generateSlug(title);
        const pubDate = new Date().toISOString();

        // 4. Download image if provided
        let localImagePath = '/default-news.jpg';
        if (image) {
            try {
                localImagePath = await downloadImage(image, slug);
                console.log(`✅ Image downloaded: ${localImagePath}`);
            } catch (imgError) {
                console.warn(`⚠️ Image download failed, using default: ${imgError.message}`);
            }
        }

        // 5. Create article object
        const article = {
            title,
            slug,
            content,
            image: localImagePath,
            category: category.toLowerCase(),
            pubDate,
            date: pubDate,
            status: 'published',
            keywords: [],
            tldr: [],
            metaDescription: content.substring(0, 160).replace(/<[^>]*>/g, ''),
            source: 'Activepieces Automation',
            originalSource: 'Automated Post',
            authorId: 'sarah-vance', // Default author
        };

        // 6. Save article
        const saved = saveArticle(article, category.toLowerCase());

        if (!saved) {
            return NextResponse.json(
                { error: 'Failed to save article' },
                { status: 500 }
            );
        }

        // 7. Rebuild index
        rebuildIndex();

        // 8. Revalidate pages for ISR
        try {
            revalidatePath('/');
            revalidatePath(`/${category.toLowerCase()}`);
            revalidatePath(`/article/${slug}`);
            console.log(`✅ Revalidated paths for ISR`);
        } catch (revalError) {
            console.warn(`⚠️ Revalidation warning: ${revalError.message}`);
        }

        // 9. Success response
        const articleUrl = `https://global-brief.vercel.app/article/${slug}`;

        return NextResponse.json({
            success: true,
            message: 'Article published successfully',
            article: {
                slug,
                title,
                category,
                url: articleUrl,
                pubDate
            }
        }, { status: 201 });

    } catch (error) {
        console.error('❌ API Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}

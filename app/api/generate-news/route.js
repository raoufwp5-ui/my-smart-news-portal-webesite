import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { NextResponse } from 'next/server';
import { saveArticle, generateSlug, getArticlesByCategory } from '@/lib/articleStore';
import { downloadMedia, extractOGImage } from '@/lib/mediaHandler';
import { model } from '@/lib/gemini';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request) {
    console.log('🔵 API /generate-news v4.0 - Advanced Media Engine');

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 10;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Missing API key" }, { status: 500 });
        }

        // 1. Try to serve local content first (FAST & STABLE)
        const localData = getArticlesByCategory(category, page, limit);
        if (localData.total > 0) {
            console.log(`✅ Serving ${localData.articles.length} local articles for ${category}`);
            return NextResponse.json({
                articles: localData.articles,
                pagination: {
                    page,
                    limit,
                    total: localData.total,
                    pages: Math.ceil(localData.total / limit)
                },
                meta: { category, source: 'local-cache', timestamp: new Date().toISOString() }
            });
        }

        // 2. Only fetch from external if no local data exists (Fallback)
        if (!FEEDS[category]) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        console.log(`📡 Cache miss. Fetching RSS: ${category}`);
        let feed = await fetchFeed(FEEDS[category]);
        if (!feed || !feed.items || feed.items.length === 0) {
            feed = await fetchFeed(FEEDS.general);
        }

        if (!feed || !feed.items || feed.items.length === 0) {
            return NextResponse.json({ error: 'No news items available' }, { status: 404 });
        }

        // Process strictly top 8 articles from the feed for high-volume delivery
        const articlesToProcess = feed.items.slice(0, 8);
        console.log(`🔄 Processing strictly 8 premium articles for ${category}...`);

        await Promise.all(articlesToProcess.map(async (item) => {
            const tempSlug = generateSlug(item.title);
            const basicData = {
                title: item.title || 'Breaking News',
                content: item.contentSnippet || item.content || item.description || "",
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                originalSource: item.creator || feed.title?.split(' - ')[0] || "World News",
                category
            };

            // Enhanced Media Scraper
            let remoteImageUrl = null;
            let videoUrl = null;

            // 1. Try RSS direct fields
            if (item.enclosure?.url) remoteImageUrl = item.enclosure.url;
            else if (item['media:content']?.['$']?.url) remoteImageUrl = item['media:content']['$'].url;
            else if (item['media:thumbnail']?.['$']?.url) remoteImageUrl = item['media:thumbnail']['$'].url;

            // 2. Try OG Scraping if RSS fails
            if (!remoteImageUrl && item.link) {
                remoteImageUrl = await extractOGImage(item.link);
            }

            if (item.link?.includes('youtube.com/watch')) {
                const videoId = item.link.split('v=')[1]?.split('&')[0];
                if (videoId) videoUrl = `https://www.youtube.com/embed/${videoId}`;
            }

            const localImage = await downloadMedia(remoteImageUrl, tempSlug, 'image');
            const localVideo = await downloadMedia(videoUrl, tempSlug, 'video');

            // Generate Content (Strict Rules)
            try {
                const prompt = `You are a professional AI News Generator. Create a high-quality SEO article.
                Strict Rules:
                1. Length: 400-600 words.
                2. Structure: Use # Title, ## and ### subheaders.
                3. SEO: Include metaDescription (char limit 160) and 5 keywords.
                4. Summary: 3 clear TL;DR bullet points.
                
                Source Title: ${basicData.title}
                Context: ${basicData.content.substring(0, 1500)}
                
                JSON Format:
                {
                  "title": "Optimized SEO Headline",
                  "content": "Full markdown content with #, ##, ### headers...",
                  "tldr": ["Point 1", "Point 2", "Point 3"],
                  "metaDescription": "...",
                  "keywords": ["tag1", "tag2", "tag3"]
                }`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const aiData = JSON.parse(response.text().replace(/```json|```/g, '').trim());

                saveArticle({
                    ...basicData,
                    ...aiData,
                    image: localImage || remoteImageUrl || '/default-news.jpg',
                    videoUrl: localVideo || videoUrl,
                    slug: tempSlug
                }, category);
            } catch (err) {
                saveArticle({
                    ...basicData,
                    tldr: ["Update in progress"],
                    content: basicData.content,
                    image: localImage || remoteImageUrl || '/default-news.jpg',
                    videoUrl: localVideo || videoUrl,
                    slug: tempSlug,
                    metaDescription: basicData.title
                }, category);
            }
        }));

        // Paginated Return (Latest-First)
        const { articles, total } = getArticlesByCategory(category, page, limit);

        return NextResponse.json({
            articles,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            meta: { category, timestamp: new Date().toISOString() }
        });

    } catch (criticalError) {
        console.error('❌ CRITICAL ERROR:', criticalError.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

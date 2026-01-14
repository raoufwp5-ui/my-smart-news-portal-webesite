import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { NextResponse } from 'next/server';
import { saveArticle, generateSlug, getArticlesByCategory } from '@/lib/articleStore';
import { downloadMedia } from '@/lib/mediaHandler';
import { model } from '@/lib/gemini';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request) {
    console.log('🔵 API /generate-news v3.0 - AI News Engine');

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = 10;

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "Missing API key" }, { status: 500 });
        }

        if (!FEEDS[category]) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        console.log(`📡 Fetching RSS: ${category}`);
        let feed = await fetchFeed(FEEDS[category]);
        if (!feed || !feed.items || feed.items.length === 0) {
            feed = await fetchFeed(FEEDS.general);
        }

        if (!feed || !feed.items || feed.items.length === 0) {
            return NextResponse.json({ error: 'No news items available' }, { status: 404 });
        }

        // Process strictly top 5 articles from the feed
        const articlesToProcess = feed.items.slice(0, 5);
        console.log(`🔄 Processing strictly 5 articles for ${category}...`);

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

            // Media Preservation
            let remoteImageUrl = null;
            let videoUrl = null;
            if (item.enclosure?.url) remoteImageUrl = item.enclosure.url;
            else if (item['media:content']?.['$']?.url) remoteImageUrl = item['media:content']['$'].url;

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

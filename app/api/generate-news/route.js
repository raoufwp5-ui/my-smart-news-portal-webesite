import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { NextResponse } from 'next/server';
import { saveArticle, generateSlug, getArticlesByCategory } from '@/lib/articleStore';
import { downloadMedia } from '@/lib/mediaHandler';
import { model } from '@/lib/gemini';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(request) {
    console.log('🔵 API /generate-news v2.5 - Persistent Intelligence');

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';

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

        // Process top 6 articles from the feed
        const articlesToProcess = feed.items.slice(0, 6);
        console.log(`🔄 Processing ${articlesToProcess.length} advanced SEO articles...`);

        await Promise.all(articlesToProcess.map(async (item) => {
            const tempSlug = generateSlug(item.title);

            const basicData = {
                title: item.title || 'Breaking News Update',
                content: item.contentSnippet || item.content || item.description || "",
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                originalSource: item.creator || feed.title?.split(' - ')[0] || "News Source",
                category: category
            };

            // Media Extraction
            let remoteImageUrl = null;
            let videoUrl = null;

            if (item.enclosure && item.enclosure.url && (item.enclosure.type?.includes('image') || item.enclosure.url.match(/\.(jpg|jpeg|png|webp|gif)/i))) {
                remoteImageUrl = item.enclosure.url;
            } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
                remoteImageUrl = item['media:content']['$'].url;
            } else if (item.image) {
                remoteImageUrl = item.image;
            } else if (item.description && item.description.includes('<img')) {
                const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) remoteImageUrl = imgMatch[1];
            }

            if (item.link?.includes('youtube.com/watch')) {
                const videoId = item.link.split('v=')[1]?.split('&')[0];
                if (videoId) videoUrl = `https://www.youtube.com/embed/${videoId}`;
            }

            // Download Media (Preservation)
            const localImage = await downloadMedia(remoteImageUrl, tempSlug, 'image');
            const localVideo = await downloadMedia(videoUrl, tempSlug, 'video');

            // Generate Content
            try {
                const prompt = `You are a high-level SEO news analyst. Create a detailed article (400-600 words) from this source.
                Include:
                - Subheadings (##)
                - Professional tone
                - Meta description
                - 5 Keywords
                
                Title: ${basicData.title}
                Text: ${basicData.content.substring(0, 2000)}
                
                JSON Format:
                {
                  "title": "Optimized Headline",
                  "tldr": ["Point 1", "Point 2", "Point 3"],
                  "content": "Markdown article text...",
                  "meta_description": "SEO Description",
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
                console.warn(`Fallback for error in AI: ${err.message}`);
                saveArticle({
                    ...basicData,
                    tldr: ["Update pending"],
                    content: basicData.content,
                    image: localImage || remoteImageUrl || '/default-news.jpg',
                    videoUrl: localVideo || videoUrl,
                    slug: tempSlug
                }, category);
            }
        }));

        // Fulfill Article Preservation & Ordering: Return everything stored for this category
        const allArticles = getArticlesByCategory(category, 50);

        return NextResponse.json({
            articles: allArticles,
            meta: { category, count: allArticles.length, timestamp: new Date().toISOString() }
        });

    } catch (criticalError) {
        console.error('❌ CRITICAL ERROR:', criticalError.message);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

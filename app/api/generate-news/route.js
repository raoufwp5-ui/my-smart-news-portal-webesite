import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { NextResponse } from 'next/server';
import { saveArticle } from '@/lib/articleStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Generate Unsplash high-quality image based on category and title keywords
function getUnsplashImage(category, title = "") {
    const keywords = {
        business: 'business,finance,stock-market,office',
        technology: 'technology,innovation,coding,gadget',
        politics: 'government,politics,election,capitol',
        sports: 'sports,athlete,competition,stadium',
        general: 'news,world,global,journalism'
    };

    // Extract potential extra keywords from title
    const titleKeywords = title.split(' ')
        .filter(word => word.length > 5)
        .slice(0, 2)
        .join(',');

    const baseQuery = keywords[category] || keywords.general;
    const query = titleKeywords ? `${baseQuery},${titleKeywords}` : baseQuery;

    return `https://source.unsplash.com/1200x800/?${query}`;
}

// Initialize Gemini with error handling
async function initializeGemini() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('❌ CRITICAL: GEMINI_API_KEY is not defined in environment variables');
            return null;
        }

        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(apiKey);
        return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    } catch (error) {
        console.error('❌ Failed to initialize Gemini:', error);
        return null;
    }
}

export async function GET(request) {
    console.log('🔵 API /generate-news called');

    // Global try-catch to ensure valid JSON is ALWAYS returned
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';

        console.log(`📂 Category: ${category}`);

        // 1. Validate API Key Early (Critical for Vercel)
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ FATAL: Missing GEMINI_API_KEY');
            return NextResponse.json({
                error: "Missing API key",
                message: "Deployment configuration error: GEMINI_API_KEY not found."
            }, { status: 500 });
        }

        // 2. Validate category
        if (!FEEDS[category]) {
            console.error(`❌ Invalid category: ${category}`);
            return NextResponse.json({
                error: 'Invalid category',
                validCategories: Object.keys(FEEDS)
            }, { status: 400 });
        }

        // 3. Fetch RSS feed with redundancy fallback
        console.log(`📡 Fetching RSS: ${category}`);
        let feed;
        try {
            feed = await fetchFeed(FEEDS[category]);
            if (!feed || !feed.items || feed.items.length === 0) {
                console.warn(`⚠️ RSS for ${category} returned no items, trying general fallback...`);
                feed = await fetchFeed(FEEDS.general);
            }
        } catch (feedError) {
            console.warn(`⚠️ RSS fetch failed for ${category}, trying general fallback...`, feedError.message);
            try {
                feed = await fetchFeed(FEEDS.general);
            } catch (fallbackError) {
                console.error('❌ CRITICAL: All RSS fetches failed');
                return NextResponse.json({ error: 'News Source Unavailable' }, { status: 503 });
            }
        }

        if (!feed || !feed.items || feed.items.length === 0) {
            return NextResponse.json({ error: 'No news items available' }, { status: 404 });
        }

        console.log(`✅ Fetched ${feed.items.length} items`);

        // 4. Initialize AI
        const model = await initializeGemini();
        const hasGemini = model !== null;

        if (!hasGemini) {
            console.warn('⚠️ Gemini AI not available, using fallback content mode');
        }

        // 5. Process articles
        const articlesToProcess = feed.items.slice(0, 6);
        console.log(`🔄 Processing ${articlesToProcess.length} articles...`);

        const processedArticles = await Promise.all(articlesToProcess.map(async (item, index) => {
            const articleId = index + 1;
            console.log(`  📝 Processing article ${articleId}/${articlesToProcess.length}: ${item.title?.substring(0, 40)}...`);

            const basicData = {
                title: item.title || 'Breaking News Update',
                content: item.contentSnippet || item.content || item.description || "",
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                originalSource: item.creator || feed.title?.split(' - ')[0] || "News Source",
                category: category
            };

            // Enhanced Media Extraction
            let imageUrl = null;
            let videoUrl = null;

            if (item.enclosure && item.enclosure.url && (item.enclosure.type?.includes('image') || item.enclosure.url.match(/\.(jpg|jpeg|png|webp|gif)/i))) {
                imageUrl = item.enclosure.url;
            } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
                imageUrl = item['media:content']['$'].url;
            } else if (item.image) {
                imageUrl = item.image;
            } else if (item.description && item.description.includes('<img')) {
                const imgMatch = item.description.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) imageUrl = imgMatch[1];
            }

            if (!imageUrl) imageUrl = getUnsplashImage(category, item.title);

            if (item.link?.includes('youtube.com/watch')) {
                const videoId = item.link.split('v=')[1]?.split('&')[0];
                if (videoId) videoUrl = `https://www.youtube.com/embed/${videoId}`;
            }

            // AI Content Generation
            if (hasGemini) {
                try {
                    const prompt = `You are a senior journalist for "Global Brief". Write a comprehensive, original news article based on the following source.
Guidelines:
1. **SUBSTANTIAL length**: Minimum 3 detailed paragraphs (400-600 words).
2. **Originality**: Rewrite the story with a unique voice, adding context and analysis.
3. **Structure**: Professional SEO headline, Intro, Deep Dive (2-3 paragraphs), Conclusion.
4. **Formatting**: Use Markdown for headers (## and ###).
5. **JSON ONLY**: Return strictly valid JSON.

Source Data:
Title: ${basicData.title}
Text: ${basicData.content.substring(0, 1500)}

Return JSON:
{
  "title": "Your Professional Headline",
  "tldr": ["Major point 1", "Major point 2", "Major point 3"],
  "content": "Full article markdown text..."
}`;

                    const result = await model.generateContent(prompt);
                    const response = await result.response;
                    const aiData = JSON.parse(response.text().replace(/```json|```/g, '').trim());

                    const finalArticle = {
                        ...basicData,
                        ...aiData,
                        image: imageUrl,
                        videoUrl: videoUrl,
                        source: basicData.link,
                        date: basicData.pubDate,
                        category: category
                    };

                    try { saveArticle(finalArticle, category); } catch (e) { console.warn("Failed storage:", e.message); }

                    console.log(`  ✅ Generated: ${finalArticle.title?.substring(0, 30)}...`);
                    return finalArticle;

                } catch (error) {
                    console.warn(`  ⚠️ AI Generation failed for item ${articleId}, using fallback`);
                }
            }

            // Fallback content if AI fails or is missing
            const fallbackArticle = {
                ...basicData,
                tldr: ["News report available", "Click for details", "Coverage in progress"],
                content: basicData.content || "An update on this story is being prepared. Please check back shortly for full analysis.",
                image: imageUrl,
                videoUrl: videoUrl,
                source: basicData.link,
                date: basicData.pubDate,
                category: category
            };

            try { saveArticle(fallbackArticle, category); } catch (e) { }
            return fallbackArticle;
        }));

        console.log(`✅ Success: Processed ${processedArticles.length} articles`);
        return NextResponse.json({
            articles: processedArticles,
            meta: { category, count: processedArticles.length, timestamp: new Date().toISOString() }
        });

    } catch (criticalError) {
        console.error('❌ CRITICAL HANDLER ERROR:', criticalError.message);
        return NextResponse.json({
            error: 'Internal Server Error',
            details: criticalError.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

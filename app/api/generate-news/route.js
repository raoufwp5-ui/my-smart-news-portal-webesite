import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { NextResponse } from 'next/server';
import { saveArticle } from '@/lib/articleStore';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Generate Unsplash fallback image based on category
function getUnsplashImage(category, title) {
    const keywords = {
        business: 'business,office,finance',
        technology: 'technology,computer,innovation',
        politics: 'government,politics,capitol',
        sports: 'sports,athlete,competition',
        general: 'news,world,global'
    };

    const query = keywords[category] || keywords.general;
    return `https://source.unsplash.com/800x600/?${query}`;
}

// Initialize Gemini with error handling
async function initializeGemini() {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error('❌ GEMINI_API_KEY is not defined in environment variables');
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

    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') || 'general';

        console.log(`📂 Category: ${category}`);

        // Validate category
        if (!FEEDS[category]) {
            console.error(`❌ Invalid category: ${category}`);
            return NextResponse.json({
                error: 'Invalid category',
                validCategories: Object.keys(FEEDS)
            }, { status: 400 });
        }

        // Fetch RSS feed
        console.log(`📡 Fetching RSS feed for ${category}...`);
        let feed;
        try {
            feed = await fetchFeed(FEEDS[category]);
        } catch (feedError) {
            console.error('❌ RSS fetch failed:', feedError);
            return NextResponse.json({
                error: 'Failed to fetch news feed',
                details: feedError.message
            }, { status: 500 });
        }

        if (!feed || !feed.items || feed.items.length === 0) {
            console.error('❌ Empty or invalid feed');
            return NextResponse.json({
                error: 'No articles found in feed',
                category
            }, { status: 500 });
        }

        console.log(`✅ Fetched ${feed.items.length} items from RSS`);

        // Initialize Gemini
        const model = await initializeGemini();
        const hasGemini = model !== null;

        if (!hasGemini) {
            console.warn('⚠️ Gemini API not available, using fallback mode');
        }

        // Process top 6 articles
        const articles = feed.items.slice(0, 6);
        console.log(`🔄 Processing ${articles.length} articles...`);

        const processedArticles = await Promise.all(articles.map(async (item, index) => {
            console.log(`  📝 Processing article ${index + 1}/${articles.length}: ${item.title?.substring(0, 50)}...`);

            const basicData = {
                title: item.title || 'Untitled Article',
                content: item.contentSnippet || item.content || item.description || "",
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                originalSource: item.creator || feed.title || "News Source",
                category: category
            };

            // Extract image from RSS or use fallback
            let imageUrl = null;
            if (item.enclosure && item.enclosure.url) {
                imageUrl = item.enclosure.url;
            } else if (item.image) {
                imageUrl = item.image;
            } else if (item['media:content'] && item['media:content']['$'] && item['media:content']['$'].url) {
                imageUrl = item['media:content']['$'].url;
            } else {
                imageUrl = getUnsplashImage(category, item.title);
            }

            // Try AI generation if available
            if (hasGemini) {
                try {
                    const prompt = `You are a senior journalist for "Global Brief". Write a comprehensive, original news article (600-900 words) based on the following source.

Guidelines:
1. **Originality**: Do NOT simply summarize. Rewrite the story with a unique voice, adding context and analysis.
2. **Structure**:
    * **Headline**: SEO-optimized, engaging, professional (no clickbait).
    * **Introduction**: Human-style hook (who, what, when, where).
    * **Context & Background**: Explain why this matters.
    * **Key Facts**: Bullet points for data/dates if needed.
    * **Analysis**: Implications and expert perspective.
    * **Conclusion**: What happens next.
3. **Tone**: Professional, objective, authoritative. NO "In this article...", NO "Let's dive in...".
4. **No External Links**: Do not include "Read more" links in the body.
5. **Citations**: At the very end, add a line: "(Sources: [Original Publisher Name])".

Original Source Data:
Title: ${basicData.title}
Content: ${basicData.content}

Return output ONLY as JSON:
{
  "title": "Your SEO Headline",
  "tldr": ["Key point 1", "Key point 2", "Key point 3"],
  "content": "The full article text (markdown supported)..."
}`;

                    const result = await model.generateContent(prompt);
                    const responseProxy = await result.response;
                    const text = responseProxy.text();

                    const jsonStr = text.replace(/```json|```/g, '').trim();
                    const aiData = JSON.parse(jsonStr);

                    const articleData = {
                        ...basicData,
                        ...aiData,
                        image: imageUrl,
                        source: basicData.link,
                        date: basicData.pubDate,
                        category: category
                    };

                    // Save article to storage
                    try {
                        saveArticle(articleData, category);
                    } catch (saveError) {
                        console.error('⚠️ Failed to save article:', saveError.message);
                        // Continue anyway - don't fail the request
                    }

                    console.log(`  ✅ Generated article: ${aiData.title?.substring(0, 50)}...`);
                    return articleData;

                } catch (genError) {
                    console.error(`  ⚠️ AI generation failed for "${basicData.title?.substring(0, 30)}...":`, genError.message);
                    // Fall through to fallback
                }
            }

            // Fallback article (no AI or AI failed)
            const fallbackArticle = {
                ...basicData,
                title: basicData.title,
                tldr: [
                    "Breaking news coverage",
                    "Full analysis coming soon",
                    "Stay tuned for updates"
                ],
                content: basicData.content || "Full article content is being prepared. Check back soon for detailed coverage.",
                source: basicData.link,
                date: basicData.pubDate,
                image: imageUrl,
                category: category
            };

            // Save fallback article
            try {
                saveArticle(fallbackArticle, category);
            } catch (saveError) {
                console.error('⚠️ Failed to save fallback article:', saveError.message);
            }

            console.log(`  ⚠️ Using fallback for: ${basicData.title?.substring(0, 50)}...`);
            return fallbackArticle;
        }));

        console.log(`✅ Successfully processed ${processedArticles.length} articles`);
        return NextResponse.json({
            articles: processedArticles,
            meta: {
                category,
                count: processedArticles.length,
                hasAI: hasGemini
            }
        });

    } catch (error) {
        console.error('❌ CRITICAL API ERROR:', error);
        console.error('Stack trace:', error.stack);

        return NextResponse.json({
            error: 'Internal Server Error',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

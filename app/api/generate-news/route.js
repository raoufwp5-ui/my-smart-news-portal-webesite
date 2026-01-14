import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { model } from '@/lib/gemini';
import { NextResponse } from 'next/server';
import { saveArticle, generateSlug } from '@/lib/articleStore';

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

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'general';

    if (!FEEDS[category]) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    try {
        const feed = await fetchFeed(FEEDS[category]);

        if (!feed || !feed.items || feed.items.length === 0) {
            return NextResponse.json({ error: 'Failed to fetch news feed' }, { status: 500 });
        }

        // Process top 6 articles
        const articles = feed.items.slice(0, 6);

        const processedArticles = await Promise.all(articles.map(async (item) => {
            const basicData = {
                title: item.title,
                content: item.contentSnippet || item.content || "",
                link: item.link,
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
            } else {
                // Use Unsplash fallback
                imageUrl = getUnsplashImage(category, item.title);
            }

            try {
                const prompt = `
You are a senior journalist for "Global Brief". Write a comprehensive, original news article (600-900 words) based on the following source.

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
}
        `;

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
                saveArticle(articleData, category);

                return articleData;
            } catch (genError) {
                console.error("Content generation failed for article:", basicData.title, genError);

                const fallbackArticle = {
                    ...basicData,
                    tldr: ["Breaking news coverage", "Full analysis coming soon", "Stay tuned for updates"],
                    source: basicData.link,
                    date: basicData.pubDate,
                    image: imageUrl,
                    category: category
                };

                // Save even fallback articles
                saveArticle(fallbackArticle, category);

                return fallbackArticle;
            }
        }));

        return NextResponse.json({ articles: processedArticles });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


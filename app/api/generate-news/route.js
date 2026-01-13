import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { model } from '@/lib/gemini';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow longer timeout for AI generation
export const dynamic = 'force-dynamic';

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

        // Process top 5 articles to respect rate limits and response time
        const articles = feed.items.slice(0, 5);

        const processedArticles = await Promise.all(articles.map(async (item) => {
            // Basic data from RSS
            const basicData = {
                title: item.title,
                content: item.contentSnippet || item.content || "",
                link: item.link,
                pubDate: item.pubDate,
                originalSource: item.creator || feed.title || "News Source"
            };

            try {
                // AI Rewriting
                const prompt = `
          You are a senior journalist for "Global Brief". Write a comprehensive, original news article (600-900 words) based on the following source.
          
          Guidelines:
          1.  **Originality**: Do NOT simply summarize. Rewrite the story with a unique voice, adding context and analysis.
          2.  **Structure**:
              *   **Headline**: SEO-optimized, engaging, professional (no clickbait).
              *   **Introduction**: Human-style hook (who, what, when, where).
              *   **Context & Background**: Explain why this matters.
              *   **Key Facts**: Bullet points for data/dates if needed.
              *   **Analysis**: Implications and expert perspective.
              *   **Conclusion**: What happens next.
          3.  **Tone**: Professional, objective, authoritative. NO "In this article...", NO "Let's dive in...".
          4.  **No External Links**: Do not include "Read more" links in the body.
          5.  **Citations**: At the very end, add a line: "(Sources: [Original Publisher Name])".
          
          Original Source Data:
          Title: ${basicData.title}
          Content: ${basicData.content}
          
          Return output ONLY as JSON:
          {
            "title": "Your SEO Headline",
            "tldr": ["Key point 1", "Key point 2", "Key point 3"],
            "content": "The full article text (markdown supported)...",
            "image": "Use the image URL if valid, else null" 
          }
        `;

                const result = await model.generateContent(prompt);
                const responseProxy = await result.response;
                const text = responseProxy.text();

                // Clean markdown code blocks if present
                const jsonStr = text.replace(/```json|```/g, '').trim();
                const aiData = JSON.parse(jsonStr);

                return {
                    ...basicData,
                    ...aiData, // Overwrite with AI generated data
                    source: basicData.link, // Keep original link
                    date: basicData.pubDate
                };
            } catch (aiError) {
                console.error("AI Generation failed for article:", basicData.title, aiError);
                // Fallback to original data if AI fails
                return {
                    ...basicData,
                    tldr: ["Content is currently being updated", "Check back in a few minutes", "Global Brief coverage in progress"],
                    source: basicData.link,
                    date: basicData.pubDate,
                    image: null // You might want to try extracting an image from RSS enclosure if available
                };
            }
        }));

        return NextResponse.json({ articles: processedArticles });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

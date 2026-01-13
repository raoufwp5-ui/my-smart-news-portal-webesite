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
          Rewrite the following news article to make it sound more engaging and human-written. 
          Also provide a catchy title, a TL;DR summary (3 bullet points), and a short engaging body content (max 150 words).
          
          Original Title: ${basicData.title}
          Original Content: ${basicData.content}
          
          Return output ONLY as JSON in this format:
          {
            "title": "New Catchy Title",
            "tldr": ["Point 1", "Point 2", "Point 3"],
            "content": "Rewritten engaging content...",
            "image": "Use the image URL from source if available, else null" 
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
                    tldr: ["AI summarization temporarily unavailable", "Read original article for details", "Click source link below"],
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

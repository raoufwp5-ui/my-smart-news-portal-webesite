import { FEEDS, fetchFeed } from '@/lib/fetchNews';
import { model } from '@/lib/gemini';
import Link from 'next/link';
import { ArrowLeft, Share2, Clock, Calendar } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // Hourly ISR

async function getArticle(slug, category) {
    const feedUrl = FEEDS[category] || FEEDS.general;
    const feed = await fetchFeed(feedUrl);

    if (!feed || !feed.items) return null;

    // Fuzzy match slug to title
    const articleItem = feed.items.find(item => {
        const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        return itemSlug === slug;
    });

    if (!articleItem) return null;

    // Generate Full Content
    try {
        const prompt = `
          You are a senior editor for "Global Brief". Write a comprehensive, original news article (800+ words) based on this source.
          
          Guidelines:
          1.  **Headline**: Professional, journalistic, and clear.
          2.  **Introduction**: Engaging hook, setting the scene.
          3.  **Body**: Detailed paragraphs with analysis, context, and background. Use subheadings (## Subheading) for structure.
          4.  **Tone**: Objective, authoritative, "Global Brief" style.
          5.  **Conclusion**: Summary and future outlook.
          6.  **Citations**: List sources at the end.
          
          Source Title: ${articleItem.title}
          Source Content: ${articleItem.contentSnippet || articleItem.content}
          
          Return JSON:
          {
            "title": "Headline",
            "content": "Full Markdown Article...",
            "image_prompt": "Description for an image if needed" 
          }
        `;

        const result = await model.generateContent(prompt);
        const responseProxy = await result.response;
        const text = responseProxy.text();
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const aiData = JSON.parse(jsonStr);

        return {
            ...articleItem,
            ...aiData,
            image: articleItem.enclosure?.url || articleItem.image || null // Use feed image or null (will handle fallback in UI)
        };

    } catch (e) {
        console.error("Error generating article:", e);
        // Fallback if generic generation fails, just return what we have
        return {
            ...articleItem,
            content: articleItem.content || articleItem.contentSnippet,
            isFallback: true
        };
    }
}

export async function generateMetadata({ params, searchParams }) {
    const { slug } = params;
    const category = searchParams.category || 'general';
    // Ideally we fetch here too, but for speed we might just titleize the slug
    const title = slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    return {
        title: `${title} | Global Brief`,
        description: `Read the full story on Global Brief.`,
    };
}

export default async function ArticlePage({ params, searchParams }) {
    const { slug } = params;
    const category = searchParams.category || 'general';

    const article = await getArticle(slug, category);

    if (!article) {
        notFound();
    }

    return (
        <article className="min-h-screen bg-white dark:bg-gray-950 pb-20">
            {/* Hero Image */}
            <div className="w-full h-[400px] relative bg-gray-200 dark:bg-gray-900">
                <img
                    src={article.image || '/default-news.jpg'}
                    alt={article.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-8 container mx-auto">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-4 text-white/90 mb-4 text-sm font-medium">
                            <span className="bg-blue-600 px-3 py-1 rounded text-white uppercase tracking-wider text-xs">
                                {category}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(article.pubDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                4 min read
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 shadow-sm">
                            {article.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 -mt-10 relative z-10">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-800">

                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8 font-medium group">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to News
                    </Link>

                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {/*  Render Markdown content simply by splitting lines or using a library if installed. 
                      For now, simple whitespace handling. 
                  */}
                        {article.content.split('\n').map((paragraph, idx) => (
                            <p key={idx} className="mb-4 text-gray-800 dark:text-gray-300 leading-relaxed">
                                {paragraph}
                            </p>
                        ))}
                    </div>

                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            Sources: {article.originalSource || 'Global Brief Wires'}
                        </p>
                    </div>

                </div>
            </div>
        </article>
    );
}

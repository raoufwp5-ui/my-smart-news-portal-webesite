import { getArticleBySlug, saveArticle, generateSlug } from '@/lib/articleStore';
import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { model } from '@/lib/gemini';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Helper to get fallback image
function getUnsplashImage(category) {
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

// Self-healing function to find article in RSS and re-generate
async function selfHealArticle(slug) {
    console.log(`🔧 Self-healing triggered for slug: ${slug}`);

    // Search through all categories
    for (const [category, url] of Object.entries(FEEDS)) {
        console.log(`  🔍 Searching in ${category} RSS...`);
        const feed = await fetchFeed(url);

        if (!feed || !feed.items) continue;

        // Find matching item by slug
        const match = feed.items.find(item => generateSlug(item.title) === slug);

        if (match) {
            console.log(`  🎯 Match found in ${category}! Re-generating content...`);

            // Re-generate article logic (same as in route.js)
            const basicData = {
                title: match.title || 'Untitled Article',
                content: match.contentSnippet || match.content || match.description || "",
                link: match.link || '#',
                pubDate: match.pubDate || new Date().toISOString(),
                originalSource: match.creator || feed.title || "News Source",
                category: category
            };

            let imageUrl = null;
            if (match.enclosure && match.enclosure.url) {
                imageUrl = match.enclosure.url;
            } else if (match.image) {
                imageUrl = match.image;
            } else {
                imageUrl = getUnsplashImage(category);
            }

            try {
                const prompt = `You are a senior journalist for "Global Brief". Write a comprehensive, original news article (600-900 words) based on the following source.
Guidelines:
1. **Originality**: Do NOT simply summarize. Rewrite the story with a unique voice, adding context and analysis.
2. **Structure**: Headline, Intro, Context, Key Facts, Analysis, Conclusion.
3. **Tone**: Professional, objective, authoritative.
4. **No External Links**.
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
                const aiData = JSON.parse(responseProxy.text().replace(/```json|```/g, '').trim());

                const articleData = {
                    ...basicData,
                    ...aiData,
                    image: imageUrl,
                    source: basicData.link,
                    date: basicData.pubDate,
                    category: category,
                    slug: slug
                };

                // Save it back to store (locally it might fail on Vercel, but memory cache will hold it)
                saveArticle(articleData, category);

                return articleData;
            } catch (error) {
                console.error('  ❌ Re-generation failed:', error.message);
                // Return basic data if AI fails
                return {
                    ...basicData,
                    tldr: ["News coverage in progress", "Updates to follow"],
                    content: basicData.content || "Content currently unavailable.",
                    image: imageUrl,
                    slug: slug
                };
            }
        }
    }

    console.warn(`  🚫 Self-healing failed: No matching article found in RSS feeds for slug ${slug}`);
    return null;
}

export async function generateMetadata({ params }) {
    const { slug } = params;
    let article = getArticleBySlug(slug);

    // If not in store, try self-heal
    if (!article) {
        article = await selfHealArticle(slug);
    }

    if (!article) {
        return {
            title: 'Article Not Found | Global Brief',
            description: 'The requested article could not be found.',
        };
    }

    return {
        title: `${article.title} | Global Brief`,
        description: article.tldr ? article.tldr[0] : article.title,
        openGraph: {
            title: article.title,
            description: article.tldr ? article.tldr[0] : article.title,
            images: article.image ? [article.image] : [],
        },
    };
}

export default async function ArticlePage({ params }) {
    const { slug } = params;
    console.log(`📄 Viewing article: ${slug}`);

    let article = getArticleBySlug(slug);

    // Self-healing attempt if store returns null
    if (!article) {
        article = await selfHealArticle(slug);
    }

    if (!article) {
        console.error(`❌ Article not found for slug: ${slug}`);
        notFound();
    }

    return (
        <article className="min-h-screen bg-white dark:bg-gray-950 pb-20">
            {/* Hero Image */}
            <div className="w-full h-[400px] relative bg-gray-200 dark:bg-gray-900 overflow-hidden">
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
                                {article.category || 'News'}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                {new Date(article.pubDate || article.date).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4 shadow-sm">
                            {article.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div className="container mx-auto px-4 -mt-10 relative z-10">
                <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl p-8 md:p-12 border border-gray-100 dark:border-gray-800">

                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-8 font-medium group transition-colors">
                        <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
                    </Link>

                    {/* TL;DR Section */}
                    {article.tldr && Array.isArray(article.tldr) && (
                        <div className="mb-10 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-lg border-l-4 border-blue-600">
                            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">TL;DR</h3>
                            <ul className="space-y-2">
                                {article.tldr.map((point, i) => (
                                    <li key={i} className="text-gray-700 dark:text-gray-300 flex items-start">
                                        <span className="mr-3 mt-1 text-blue-500 font-bold">•</span>
                                        <span className="leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        {article.content ? article.content.split('\n').map((paragraph, idx) => {
                            if (paragraph.startsWith('## ')) {
                                return (
                                    <h2 key={idx} className="text-2xl font-bold mt-10 mb-5 text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
                                        {paragraph.replace('## ', '')}
                                    </h2>
                                );
                            }
                            if (paragraph.startsWith('### ')) {
                                return (
                                    <h3 key={idx} className="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">
                                        {paragraph.replace('### ', '')}
                                    </h3>
                                );
                            }
                            if (paragraph.trim() === '') return null;

                            return (
                                <p key={idx} className="mb-5 text-gray-800 dark:text-gray-300 leading-relaxed text-lg">
                                    {paragraph}
                                </p>
                            );
                        }) : <p className="text-gray-500 italic">Content reading failed. Please check the source link below.</p>}
                    </div>

                    {/* Video Support (If present in metadata/content) */}
                    {article.videoUrl && (
                        <div className="my-10 aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
                            <iframe
                                src={article.videoUrl}
                                className="w-full h-full"
                                allowFullScreen
                                title="Report Video"
                            />
                        </div>
                    )}

                    {/* Footer / Sources */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400 italic">
                            Sources: {article.originalSource || 'Global Brief Correspondent'}
                        </div>
                        {article.source && (
                            <a
                                href={article.source}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center gap-2"
                            >
                                View Original Report <AlertCircle size={16} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </article>
    );
}

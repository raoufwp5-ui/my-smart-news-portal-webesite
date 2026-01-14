import { getArticleBySlug, saveArticle, generateSlug } from '@/lib/articleStore';
import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { model } from '@/lib/gemini';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

// Helper to get fallback image
function getUnsplashImage(category, title = "") {
    const keywords = {
        business: 'business,finance,stock-market,office',
        technology: 'technology,innovation,coding,gadget',
        politics: 'government,politics,election,capitol',
        sports: 'sports,athlete,competition,stadium',
        general: 'news,world,global,journalism'
    };

    // Extract potential extra keywords from title
    const titleKeywords = title?.split(' ')
        .filter(word => word.length > 5)
        .slice(0, 2)
        .join(',');

    const baseQuery = keywords[category] || keywords.general;
    const query = titleKeywords ? `${baseQuery},${titleKeywords}` : baseQuery;

    return `https://source.unsplash.com/1200x800/?${query}`;
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
            let videoUrl = null;

            // Image Extraction
            if (match.enclosure && match.enclosure.url && (match.enclosure.type?.includes('image') || match.enclosure.url.match(/\.(jpg|jpeg|png|webp|gif)/i))) {
                imageUrl = match.enclosure.url;
            } else if (match['media:content'] && match['media:content']['$'] && match['media:content']['$'].url) {
                imageUrl = match['media:content']['$'].url;
            } else if (match.image) {
                imageUrl = match.image;
            } else {
                imageUrl = getUnsplashImage(category, match.title);
            }

            // Video Extraction
            if (match.enclosure && match.enclosure.url && match.enclosure.type?.includes('video')) {
                videoUrl = match.enclosure.url;
            } else if (match.link && match.link.includes('youtube.com/watch')) {
                const videoId = match.link.split('v=')[1]?.split('&')[0];
                if (videoId) videoUrl = `https://www.youtube.com/embed/${videoId}`;
            }

            try {
                const prompt = `You are a senior journalist for "Global Brief". Write a comprehensive, original news article based on the following source.
Guidelines:
1. **Length**: Write a SUBSTANTIAL article. Minimum 3 detailed paragraphs (approx 400-600 words).
2. **Originality**: Do NOT simply summarize. Rewrite the story with a unique voice, adding context and analysis.
3. **Structure**: Headline, Intro, Deep Dive, Bullet Points (if any), Conclusion.
4. **Tone**: Professional, objective, authoritative.
5. **Formatting**: Use Markdown for headers (## and ###).

Original Source Data:
Title: ${basicData.title}
Content: ${basicData.content}

Return output ONLY as JSON:
{
  "title": "Your SEO Headline",
  "tldr": ["Key point 1", "Key point 2", "Key point 3"],
  "content": "The full article text with markdown headers and multiple paragraphs..."
}`;

                const result = await model.generateContent(prompt);
                const responseProxy = await result.response;
                const aiData = JSON.parse(responseProxy.text().replace(/```json|```/g, '').trim());

                const articleData = {
                    ...basicData,
                    ...aiData,
                    image: imageUrl,
                    videoUrl: videoUrl,
                    source: basicData.link,
                    date: basicData.pubDate,
                    category: category,
                    slug: slug
                };

                // Save it back to store
                saveArticle(articleData, category);

                return articleData;
            } catch (error) {
                console.error('  ❌ Re-generation failed:', error.message);
                return {
                    ...basicData,
                    tldr: ["News coverage in progress", "Updates to follow"],
                    content: basicData.content || "Content currently unavailable.",
                    image: imageUrl,
                    videoUrl: videoUrl,
                    slug: slug
                };
            }
        }
    }

    return null;
}

export async function generateMetadata({ params }) {
    const { slug } = params;
    let article = await getArticleBySlug(slug);

    if (!article) {
        article = await selfHealArticle(slug);
    }

    if (!article) {
        return { title: 'Article Not Found | Global Brief' };
    }

    return {
        title: `${article.title} | Global Brief`,
        description: article.tldr ? article.tldr[0] : article.title,
    };
}

export default async function ArticlePage({ params }) {
    const { slug } = params;
    let article = await getArticleBySlug(slug);

    if (!article) {
        article = await selfHealArticle(slug);
    }

    if (!article) {
        notFound();
    }

    return (
        <article className="min-h-screen bg-white dark:bg-gray-950 pb-20">
            {/* Hero Section */}
            <div className="w-full h-[500px] relative bg-gray-900 overflow-hidden">
                <img
                    src={article.image || '/default-news.jpg'}
                    alt={article.title}
                    className="w-full h-full object-cover opacity-60 scale-105"
                    style={{ filter: 'blur(20px)' }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 container mx-auto">
                    <div className="max-w-4xl">
                        <div className="flex items-center justify-center gap-4 text-white/90 mb-6 text-sm font-bold uppercase tracking-widest">
                            <span className="bg-blue-600 px-4 py-1.5 rounded-full text-white">
                                {article.category || 'News'}
                            </span>
                            <span className="flex items-center gap-2">
                                <Calendar size={16} />
                                {new Date(article.pubDate || article.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] mb-8 drop-shadow-2xl">
                            {article.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Layout */}
            <div className="container mx-auto px-4 -mt-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">

                    {/* Main Content Area */}
                    <div className="lg:col-span-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-14 border border-gray-100 dark:border-gray-800">

                        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-12 font-bold group transition-all text-sm uppercase tracking-widest">
                            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-2 transition-transform" /> Back to Intelligence
                        </Link>

                        {/* Featured Image inside content */}
                        {article.image && (
                            <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
                                <img src={article.image} alt="Report Visual" className="w-full h-full object-cover" />
                            </div>
                        )}

                        {/* Video Embed */}
                        {article.videoUrl && (
                            <div className="mb-12 aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border-4 border-gray-100 dark:border-gray-800">
                                <iframe
                                    src={article.videoUrl}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title="Exclusive Report"
                                />
                            </div>
                        )}

                        {/* Article Text */}
                        <div className="prose prose-xl dark:prose-invert max-w-none">
                            {article.content ? article.content.split('\n').map((paragraph, idx) => {
                                if (paragraph.startsWith('## ')) {
                                    return (
                                        <h2 key={idx} className="text-3xl font-black mt-14 mb-6 text-gray-900 dark:text-white leading-tight">
                                            {paragraph.replace('## ', '')}
                                        </h2>
                                    );
                                }
                                if (paragraph.startsWith('### ')) {
                                    return (
                                        <h3 key={idx} className="text-2xl font-bold mt-10 mb-4 text-gray-900 dark:text-white">
                                            {paragraph.replace('### ', '')}
                                        </h3>
                                    );
                                }
                                if (paragraph.trim() === '') return null;

                                return (
                                    <p key={idx} className="mb-8 text-gray-800 dark:text-gray-300 leading-relaxed text-xl font-light">
                                        {paragraph}
                                    </p>
                                );
                            }) : <p className="text-gray-500 italic">Analysis engine processing... Please refer to original source below.</p>}
                        </div>

                        {/* Meta / Source Footer */}
                        <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
                                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                    <span className="text-blue-600 font-bold">GB</span>
                                </div>
                                <div className="text-sm">
                                    <p className="font-bold text-gray-900 dark:text-white">Global Brief Editorial</p>
                                    <p className="italic underline">Source: {article.originalSource || 'Wire Services'}</p>
                                </div>
                            </div>

                            {article.source && (
                                <a
                                    href={article.source}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-8 py-3 text-sm font-bold text-white bg-gray-900 dark:bg-white dark:text-black rounded-full hover:scale-105 transition-all flex items-center gap-2"
                                >
                                    Access Original Source <AlertCircle size={18} />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Sidebar / Quick View */}
                    <div className="lg:col-span-4 lg:sticky lg:top-10 h-fit">
                        {article.tldr && Array.isArray(article.tldr) && (
                            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-2xl">
                                <h3 className="text-xl font-black uppercase tracking-[0.2em] mb-6 border-b border-white/20 pb-4">
                                    Executive TL;DR
                                </h3>
                                <ul className="space-y-6">
                                    {article.tldr.map((point, i) => (
                                        <li key={i} className="flex items-start">
                                            <div className="min-w-[24px] h-[24px] rounded-full bg-white/20 flex items-center justify-center mr-4 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <span className="text-lg leading-snug font-medium opacity-95">{point}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
                            <h4 className="font-bold mb-4 text-gray-900 dark:text-white">Analysis Status</h4>
                            <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-xl text-sm font-bold">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Verified AI Intel Report
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </article>
    );
}

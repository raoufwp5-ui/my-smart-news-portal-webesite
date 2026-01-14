import { getArticleBySlug, saveArticle, generateSlug } from '@/lib/articleStore';
import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { model } from '@/lib/gemini';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

/**
 * Self-healing logic (Server-side)
 * Re-fetches and re-generates article if missing from local store
 */
async function selfHealArticle(slug) {
    console.log(`🔧 Self-healing triggered: ${slug}`);
    try {
        for (const [category, url] of Object.entries(FEEDS)) {
            const feed = await fetchFeed(url);
            if (!feed?.items) continue;

            const match = feed.items.find(item => generateSlug(item.title) === slug);
            if (match) {
                const basicData = {
                    title: match.title || 'Untitled',
                    content: match.contentSnippet || match.content || match.description || "",
                    link: match.link || '#',
                    pubDate: match.pubDate || new Date().toISOString(),
                    originalSource: match.creator || "News Source",
                    category: category
                };

                let imageUrl = null;
                let videoUrl = null;

                if (match.enclosure?.url) imageUrl = match.enclosure.url;
                else if (match['media:content']?.['$']?.url) imageUrl = match['media:content']['$'].url;

                if (match.link?.includes('youtube.com/watch')) {
                    const videoId = match.link.split('v=')[1]?.split('&')[0];
                    if (videoId) videoUrl = `https://www.youtube.com/embed/${videoId}`;
                }

                const prompt = `Rewrite this news as a 400-600 word SEO article with headers. Return strictly JSON.
                Title: ${basicData.title}
                Text: ${basicData.content.substring(0, 1000)}`;

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const aiData = JSON.parse(response.text().replace(/```json|```/g, '').trim());

                const final = {
                    ...basicData,
                    ...aiData,
                    image: imageUrl || '/default-news.jpg',
                    videoUrl,
                    slug
                };

                saveArticle(final, category);
                return final;
            }
        }
    } catch (e) {
        console.error("Self-heal failed:", e.message);
    }
    return null;
}

export async function generateMetadata({ params }) {
    const { slug } = params;
    let article = await getArticleBySlug(slug);
    if (!article) article = await selfHealArticle(slug);

    if (!article) return { title: 'Article Not Found | Global Brief' };

    const description = article.metaDescription || article.meta_description || (article.tldr ? article.tldr[0] : article.title);

    return {
        title: article.title,
        description: description.substring(0, 160),
        keywords: article.keywords?.join(', '),
        openGraph: {
            title: article.title,
            description: description,
            images: [article.image],
        }
    };
}

// Client-side capable safe components
function SafeImage({ src, alt, className, style }) {
    const fallback = '/default-news.jpg';
    return (
        <img
            src={src || fallback}
            alt={alt}
            className={className}
            style={style}
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = fallback;
            }}
        />
    );
}

function VideoPlayer({ url }) {
    if (!url) return null;
    return (
        <div className="mb-12 aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border-4 border-gray-100 dark:border-gray-800">
            <iframe
                src={url}
                className="w-full h-full"
                allowFullScreen
                title="Video Content"
            />
        </div>
    );
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
            {/* Header / Hero */}
            <div className="w-full h-[500px] relative bg-gray-900 overflow-hidden">
                <SafeImage
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover opacity-60 scale-105"
                    style={{ filter: 'blur(15px)' }}
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

            {/* Content Container */}
            <div className="container mx-auto px-4 -mt-24 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-7xl mx-auto">

                    <div className="lg:col-span-8 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 md:p-14 border border-gray-100 dark:border-gray-800">
                        <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-12 font-bold group transition-all text-sm uppercase tracking-widest">
                            <ArrowLeft size={18} className="mr-2 group-hover:-translate-x-2 transition-transform" /> Back to Home
                        </Link>

                        {/* Main Media */}
                        {article.image && (
                            <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-800">
                                <SafeImage src={article.image} alt="Report Visual" className="w-full h-full object-cover" />
                            </div>
                        )}

                        <VideoPlayer url={article.videoUrl} />

                        {/* Article Text Rendering */}
                        <div className="prose prose-xl dark:prose-invert max-w-none">
                            {article.content ? article.content.split('\n').map((paragraph, idx) => {
                                if (paragraph.startsWith('## ')) {
                                    return <h2 key={idx} className="text-3xl font-black mt-14 mb-6">{paragraph.replace('## ', '')}</h2>;
                                }
                                if (paragraph.startsWith('### ')) {
                                    return <h3 key={idx} className="text-2xl font-bold mt-10 mb-4">{paragraph.replace('### ', '')}</h3>;
                                }
                                if (!paragraph.trim()) return null;
                                return <p key={idx} className="mb-8 text-gray-800 dark:text-gray-300 leading-relaxed text-xl font-light">
                                    {paragraph.replace(/\*\*(.*?)\*\*/g, '$1')}
                                </p>;
                            }) : <p className="text-gray-500 italic">Processing full report...</p>}
                        </div>

                        {/* SEO Tags */}
                        {article.keywords && (
                            <div className="mt-12 flex flex-wrap gap-2">
                                {article.keywords.map((tag, i) => (
                                    <span key={i} className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full uppercase tracking-widest">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Credit Footer */}
                        <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">GB</div>
                                <div className="text-sm">
                                    <p className="font-bold">Global Brief Intel</p>
                                    <p className="text-gray-500">Source: {article.originalSource}</p>
                                </div>
                            </div>
                            {article.source && (
                                <a href={article.source} target="_blank" className="px-8 py-3 bg-black dark:bg-white dark:text-black text-white rounded-full font-bold text-sm">
                                    Original Coverage
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-10 h-fit">
                        {article.tldr && (
                            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl">
                                <h3 className="text-xl font-black uppercase tracking-widest mb-6 border-b border-white/20 pb-4">Executive Summary</h3>
                                <ul className="space-y-4">
                                    {article.tldr.map((pt, i) => (
                                        <li key={i} className="flex gap-4">
                                            <span className="font-bold opacity-50">{i + 1}</span>
                                            <span className="font-medium">{pt}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </article>
    );
}

import { getArticleBySlug, saveArticle, generateSlug, getRelatedArticles } from '@/lib/articleStore';
import NewsCard from '@/components/NewsCard';
import { fetchFeed, FEEDS } from '@/lib/fetchNews';
import { model } from '@/lib/gemini';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, AlertCircle } from 'lucide-react';
import { notFound } from 'next/navigation';

export const revalidate = 3600;

import { extractOGImage, downloadMedia } from '@/lib/mediaHandler';

/**
 * Self-healing logic (Server-side)
 * Re-fetches, re-generates, and repairs high-quality articles & media
 */
async function selfHealArticle(slug, existingArticle = null) {
    console.log(`🔧 Self-healing triggered: ${slug} (${existingArticle ? 'Repairing' : 'Fresh Fetch'})`);

    try {
        let sourceData = null;
        let category = existingArticle?.category || 'general';

        // 1. Try to find in RSS feeds first
        for (const [cat, url] of Object.entries(FEEDS)) {
            const feed = await fetchFeed(url);
            if (!feed?.items) continue;

            const match = feed.items.find(item => generateSlug(item.title) === slug);
            if (match) {
                category = cat;
                sourceData = {
                    title: match.title || existingArticle?.title || 'Untitled',
                    content: match.contentSnippet || match.content || match.description || existingArticle?.content || "",
                    link: match.link || existingArticle?.source || '#',
                    pubDate: match.pubDate || existingArticle?.pubDate || new Date().toISOString(),
                    originalSource: match.creator || existingArticle?.originalSource || "Global News",
                    remoteImageUrl: match.enclosure?.url || (match['media:content']?.['$']?.url) || (match['media:thumbnail']?.['$']?.url),
                    remoteVideoUrl: match.link?.includes('youtube.com/watch') ? `https://www.youtube.com/embed/${match.link.split('v=')[1]?.split('&')[0]}` : null
                };

                // Try scraping if RSS media is missing
                if (!sourceData.remoteImageUrl && sourceData.link) {
                    sourceData.remoteImageUrl = await extractOGImage(sourceData.link);
                }
                break;
            }
        }

        // 2. Fallback to existing article data if not in RSS
        if (!sourceData && existingArticle) {
            sourceData = {
                title: existingArticle.title,
                content: existingArticle.content || existingArticle.tldr?.join(' ') || "",
                link: existingArticle.source || existingArticle.link || '#',
                pubDate: existingArticle.pubDate || existingArticle.date || new Date().toISOString(),
                originalSource: existingArticle.originalSource || "Archive",
                remoteImageUrl: existingArticle.image?.startsWith('http') ? existingArticle.image : null,
                remoteVideoUrl: existingArticle.videoUrl
            };

            // Scraping last resort for archive articles
            if (!sourceData.remoteImageUrl && sourceData.link && sourceData.link !== '#') {
                sourceData.remoteImageUrl = await extractOGImage(sourceData.link);
            }
        }

        if (!sourceData) return existingArticle;

        // 3. Process Media
        const localImage = await downloadMedia(sourceData.remoteImageUrl, slug, 'image');
        const localVideo = await downloadMedia(sourceData.remoteVideoUrl, slug, 'video');

        // 4. Transform to Premium Content
        const prompt = `You are a Lead AI News Analyst. Reconstruct this news article into a comprehensive, long-form SEO report.
        Strict Requirements:
        - Word Count: 400-600 words.
        - Structure: Professional H1 Title, H2 and H3 Subheadings.
        - Format: Markdown.
        - Additional: 3 TL;DR Bullet Points, 5 SEO Keywords, and a 160-char Meta Description.
        
        Source Data:
        Title: ${sourceData.title}
        Snippet: ${sourceData.content.substring(0, 1500)}
        
        Return JSON:
        {
          "title": "Optimized Headline",
          "content": "Full markdown content with #, ##, ### headers...",
          "tldr": ["Point 1", "Point 2", "Point 3"],
          "metaDescription": "...",
          "keywords": ["tag1", "tag2", "tag3"]
        }`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiData = JSON.parse(response.text().replace(/```json|```/g, '').trim());

        const final = {
            ...sourceData,
            ...aiData,
            image: localImage || '/default-news.jpg',
            videoUrl: localVideo || sourceData.remoteVideoUrl || null,
            slug
        };

        saveArticle(final, category);
        return final;

    } catch (e) {
        console.error(`❌ Self-heal critical failure for ${slug}:`, e.message);
        return existingArticle;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = params;

    try {
        let article = await getArticleBySlug(slug);

        const isThin = article && (article.content?.length < 1500 || !article.image?.startsWith('/media'));
        if (!article || isThin) {
            article = await selfHealArticle(slug, article);
        }

        if (!article) return { title: 'Article Not Found | Global Brief' };

        const description = article.metaDescription || article.meta_description || (article.tldr ? article.tldr[0] : article.title);

        return {
            metadataBase: new URL('https://my-smart-news-portal-webesite.vercel.app'),
            title: article.title,
            description: description.substring(0, 160),
            keywords: article.keywords?.join(', '),
            openGraph: {
                title: article.title,
                description: description,
                images: [article.image],
                url: `https://my-smart-news-portal-webesite.vercel.app/article/${slug}`,
            },
            twitter: {
                card: 'summary_large_image',
                title: article.title,
                description: description,
                images: [article.image],
            }
        };
    } catch (error) {
        console.error(`🔴 METADATA ERROR [${slug}]:`, error.message);
        return { title: 'Global Brief | Premium News' };
    }
}

import { SafeImage, VideoPlayer } from '@/components/ArticleMedia';
import SocialShare from '@/components/SocialShare';

export default async function ArticlePage({ params }) {
    const { slug } = params;

    try {
        let article = await getArticleBySlug(slug);

        // Trigger healing if missing OR content is too thin
        const isThin = article && (article.content?.length < 1500 || !article.image?.startsWith('/media'));

        if (!article || isThin) {
            article = await selfHealArticle(slug, article);
        }

        if (!article) {
            notFound();
        }

        const relatedArticles = getRelatedArticles(slug, article.category, 3);

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
                                <span className="bg-red-600 px-4 py-1.5 rounded-full text-white">
                                    {article.category || 'News'}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    {(() => {
                                        try {
                                            return new Date(article.pubDate || article.date || new Date()).toLocaleDateString(undefined, { dateStyle: 'long' });
                                        } catch (e) {
                                            return new Date().toLocaleDateString(undefined, { dateStyle: 'long' });
                                        }
                                    })()}
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
                            <Link href="/" className="inline-flex items-center text-red-600 hover:text-red-700 dark:text-red-400 mb-12 font-bold group transition-all text-sm uppercase tracking-widest">
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

                            <SocialShare title={article.title} slug={slug} />

                            {/* Credit Footer */}
                            <div className="mt-20 pt-10 border-t border-gray-100 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">GB</div>
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
                                <div className="bg-red-600 rounded-3xl p-8 text-white shadow-xl mb-10">
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

                            {/* Related News Widget */}
                            {relatedArticles.length > 0 && (
                                <div className="bg-gray-50 dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800">
                                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                                        <span className="w-2 h-8 bg-red-600 rounded-full"></span>
                                        On The Radar
                                    </h3>
                                    <div className="space-y-6">
                                        {relatedArticles.map(rel => (
                                            <NewsCard key={rel.slug} article={rel} compact={true} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'NewsArticle',
                            headline: article.title,
                            image: [
                                article.image.startsWith('http') ? article.image : `https://global-brief.vercel.app${article.image}`
                            ],
                            datePublished: new Date(article.pubDate || article.date || new Date()).toISOString(),
                            dateModified: new Date(article.savedAt || new Date()).toISOString(),
                            author: [{
                                '@type': 'Person',
                                name: 'Global Brief Editorial Team',
                                url: 'https://global-brief.vercel.app/about'
                            }],
                            publisher: {
                                '@type': 'Organization',
                                name: 'Global Brief',
                                logo: {
                                    '@type': 'ImageObject',
                                    url: 'https://global-brief.vercel.app/icon.png'
                                }
                            },
                            mainEntityOfPage: {
                                '@type': 'WebPage',
                                '@id': `https://global-brief.vercel.app/article/${slug}`
                            },
                            description: article.metaDescription || article.tldr?.[0] || article.title
                        })
                    }}
                />
            </article>
        );
    } catch (criticalError) {
        console.error(`🔴 CRITICAL RENDER ERROR [${slug}]:`, criticalError.message);
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-900">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 mb-6">
                    <AlertCircle size={40} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4">Content Temporarily Unavailable</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
                    We're sorry, but this report is currently undergoing maintenance or is being rebuilt by our AI engine.
                </p>
                <Link href="/" className="px-8 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-all">
                    Return to News Feed
                </Link>
            </div>
        );
    }
}

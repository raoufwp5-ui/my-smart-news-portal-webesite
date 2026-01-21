export default function ArticleSchema({ article, authorName, authorUrl }) {
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": article.title,
        "description": article.metaDescription || article.description || article.tldr,
        "image": article.image ? `https://global-brief.vercel.app${article.image}` : "https://global-brief.vercel.app/default-news.jpg",
        "datePublished": article.pubDate || article.savedAt,
        "dateModified": article.updatedAt || article.pubDate || article.savedAt,
        "author": {
            "@type": "Person",
            "name": authorName || "Global Brief Editorial Team",
            "url": authorUrl || "https://global-brief.vercel.app/authors"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Global Brief",
            "logo": {
                "@type": "ImageObject",
                "url": "https://global-brief.vercel.app/logo-square.png",
                "width": 512,
                "height": 512
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://global-brief.vercel.app/article/${article.slug}`
        },
        "articleSection": article.category,
        "keywords": article.keywords ? article.keywords.join(', ') : article.category,
        "wordCount": article.wordCount || 0,
        "inLanguage": "en-US"
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
    );
}

export function generateArticleSchema(article, slug) {
    if (!article) return null;

    const siteUrl = 'https://my-smart-news-portal-webesite.vercel.app';
    const articleUrl = `${siteUrl}/article/${slug}`;
    const imageUrl = article.image?.startsWith('http') 
        ? article.image 
        : `${siteUrl}${article.image}`;

    return {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        image: [imageUrl],
        datePublished: new Date(article.pubDate || article.date || new Date()).toISOString(),
        dateModified: new Date(article.savedAt || new Date()).toISOString(),
        author: [{
            '@type': 'Person',
            name: 'Global Brief Editorial Team',
            url: `${siteUrl}/about`
        }],
        publisher: {
            '@type': 'Organization',
            name: 'Global Brief',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/icon.png`
            }
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': articleUrl
        },
        description: article.metaDescription || article.tldr?.[0] || article.title,
        keywords: article.keywords ? article.keywords.join(', ') : undefined,
        articleBody: article.content ? article.content.substring(0, 150) + '...' : undefined,
        inLanguage: 'en-US'
    };
}

export function generateBreadcrumbSchema(slug, title) {
    const siteUrl = 'https://my-smart-news-portal-webesite.vercel.app';

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: siteUrl
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'News',
                item: `${siteUrl}/#news`
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: title,
                item: `${siteUrl}/article/${slug}`
            }
        ]
    };
}

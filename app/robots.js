export default function robots() {
    const baseUrl = 'https://global-brief.vercel.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/api/',
        },
        sitemap: [
            `${baseUrl}/sitemap.xml`,
            `${baseUrl}/sitemap-news.xml`
        ],
    };
}

export default function robots() {
    const baseUrl = 'https://my-smart-news-portal-webesite.vercel.app';

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

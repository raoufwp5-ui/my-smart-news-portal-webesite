export default function robots() {
    const baseUrl = 'https://ai-news-website.vercel.app'; // Replace with actual domain in prod

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: '/api/',
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}

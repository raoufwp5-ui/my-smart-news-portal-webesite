export default function sitemap() {
    const baseUrl = 'https://ai-news-website.vercel.app'; // Replace with actual domain
    const categories = ['business', 'technology', 'politics', 'sports'];

    const categoryUrls = categories.map((cat) => ({
        url: `${baseUrl}/${cat}`,
        lastModified: new Date(),
        changeFrequency: 'hourly',
        priority: 0.8,
    }));

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'hourly',
            priority: 1,
        },
        ...categoryUrls,
    ];
}

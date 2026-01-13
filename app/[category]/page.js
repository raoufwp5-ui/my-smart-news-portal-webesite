import NewsFeed from '@/components/NewsFeed';

export const revalidate = 3600; // Hourly updates

export function generateMetadata({ params }) {
    const title = params.category.charAt(0).toUpperCase() + params.category.slice(1);
    const description = `Latest ${title} news and in-depth analysis. Get the top headlines in Business, Tech, Politics, and Sports.`;

    return {
        title: `${title} News | Global Brief`,
        description: description,
        openGraph: {
            title: `${title} News | AI News Daily`,
            description: description,
            type: 'website',
            url: `https://ai-news-website.vercel.app/${params.category}`,
            images: [
                {
                    url: `https://ai-news-website.vercel.app/og-${params.category}.jpg`, // Ensure you have these images or use a dynamic OG generator
                    width: 1200,
                    height: 630,
                    alt: `${title} News`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} News | Global Brief`,
            description: description,
            images: [`https://ai-news-website.vercel.app/og-${params.category}.jpg`],
        },
    };
}

export default function CategoryPage({ params }) {
    const title = params.category.charAt(0).toUpperCase() + params.category.slice(1);

    return (
        <div>
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold mb-4 capitalize text-gray-900 dark:text-gray-100">
                    {title} News
                </h1>
                <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </header>

            <NewsFeed category={params.category} />
        </div>
    );
}

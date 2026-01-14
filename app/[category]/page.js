import NewsFeed from '@/components/NewsFeed';
import { redirect } from 'next/navigation';

export const revalidate = 3600;

const VALID_CATEGORIES = ['business', 'technology', 'politics', 'sports', 'general'];

export function generateMetadata({ params }) {
    try {
        const { category } = params;

        // Validate category
        if (!category || !VALID_CATEGORIES.includes(category)) {
            return {
                title: 'Category Not Found | Global Brief',
                description: 'The requested category could not be found.'
            };
        }

        const title = category.charAt(0).toUpperCase() + category.slice(1);
        const description = `Latest ${title} news and in-depth analysis. Breaking news, global stories, and in-depth coverage.`;

        return {
            metadataBase: new URL('https://my-smart-news-portal-webesite.vercel.app'),
            title: `${title} News | Global Brief`,
            description: description,
            openGraph: {
                title: `${title} News | Global Brief`,
                description: description,
                url: `https://my-smart-news-portal-webesite.vercel.app/${category}`,
                siteName: 'Global Brief',
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} News | Global Brief`,
                description: description,
            },
        };
    } catch (error) {
        console.error('🔴 Metadata Generation Error:', error.message);
        return { title: 'Global News | Global Brief' };
    }
}

export default function CategoryPage({ params }) {
    const { category } = params || {};

    // Validate category - redirect to homepage if invalid or missing
    if (!category || !VALID_CATEGORIES.includes(category)) {
        redirect('/');
    }

    const title = category.charAt(0).toUpperCase() + category.slice(1);
    const description = `Latest ${title} news and in-depth analysis for ${title}.`;

    // Structured Data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${title} News | Global Brief`,
        description: description,
        url: `https://my-smart-news-portal-webesite.vercel.app/${category}`,
    };

    return (
        <div className="min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <header className="mb-12 text-center">
                <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-red-600 uppercase bg-red-50 dark:bg-red-900/20 rounded-full">
                    World Category
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-6 capitalize text-gray-900 dark:text-gray-100 drop-shadow-sm">
                    {title} <span className="text-red-600">News</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-lg mb-8">
                    {description}
                </p>
                <div className="w-32 h-1.5 bg-gradient-to-r from-red-600 to-transparent mx-auto rounded-full"></div>
            </header>

            <main>
                <NewsFeed category={category} />
            </main>
        </div>
    );
}

// Generate static params for all valid categories to ensure successful prerender
export async function generateStaticParams() {
    return VALID_CATEGORIES.map((category) => ({
        category: category,
    }));
}

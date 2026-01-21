import NewsFeed from '@/components/NewsFeed';
import AdsterraSlot from '@/components/AdsterraSlot';
import { redirect } from 'next/navigation';
import categoryData from '@/data/categories.json';

export const revalidate = 3600;

const VALID_CATEGORIES = ['business', 'technology', 'politics', 'sports', 'general'];

export function generateMetadata({ params }) {
    try {
        const { category } = params;

        if (!category || !VALID_CATEGORIES.includes(category)) {
            return {
                title: 'Category Not Found | Global Brief',
                description: 'The requested category could not be found.'
            };
        }

        const data = categoryData[category] || {};
        const title = data.title || (category.charAt(0).toUpperCase() + category.slice(1));
        const description = data.description || `Latest ${title} news and in-depth analysis.`;

        return {
            metadataBase: new URL('https://global-brief.vercel.app'),
            title: `${title} | Global Brief`,
            description: description,
            openGraph: {
                title: `${title} | Global Brief`,
                description: description,
                url: `https://global-brief.vercel.app/${category}`,
                siteName: 'Global Brief',
                type: 'website',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${title} | Global Brief`,
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

    if (!category || !VALID_CATEGORIES.includes(category)) {
        redirect('/');
    }

    const data = categoryData[category] || {};
    const title = data.title || (category.charAt(0).toUpperCase() + category.slice(1));
    const description = data.description || `Leading coverage of ${category}.`;
    const intro = data.intro || "Essential reporting.";

    // Structured Data for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${title}`,
        description: description,
        url: `https://global-brief.vercel.app/${category}`,
        breadcrumb: {
            "@type": "BreadcrumbList",
            "itemListElement": [{
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://global-brief.vercel.app"
            }, {
                "@type": "ListItem",
                "position": 2,
                "name": title,
                "item": `https://global-brief.vercel.app/${category}`
            }]
        }
    };

    return (
        <div className="min-h-screen">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <header className="mb-12 text-center max-w-4xl mx-auto">
                <div className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-widest text-red-600 uppercase bg-red-50 dark:bg-red-900/20 rounded-full">
                    {intro}
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-6 text-gray-900 dark:text-gray-100 drop-shadow-sm">
                    {title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                    {description}
                </p>
                <div className="w-32 h-1.5 bg-red-600 mx-auto rounded-full"></div>
            </header>

            <main>
                <div className="mb-10">
                    <AdsterraSlot type="banner" format="728x90" />
                </div>
                <NewsFeed category={category} />
                <div className="mt-20">
                    <AdsterraSlot type="native" />
                </div>
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

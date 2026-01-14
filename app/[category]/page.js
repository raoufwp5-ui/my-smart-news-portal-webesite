import NewsFeed from '@/components/NewsFeed';
import { redirect } from 'next/navigation';

export const revalidate = 3600;

const VALID_CATEGORIES = ['business', 'technology', 'politics', 'sports'];

export function generateMetadata({ params }) {
    const { category } = params;

    // Validate category
    if (!VALID_CATEGORIES.includes(category)) {
        return {
            title: 'Category Not Found | Global Brief',
            description: 'The requested category could not be found.'
        };
    }

    const title = category.charAt(0).toUpperCase() + category.slice(1);
    const description = `Latest ${title} news and in-depth analysis. Breaking news, global stories, and in-depth coverage.`;

    return {
        title: `${title} News | Global Brief`,
        description: description,
        openGraph: {
            title: `${title} News | Global Brief`,
            description: description,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: `${title} News | Global Brief`,
            description: description,
        },
    };
}

export default function CategoryPage({ params }) {
    const { category } = params;

    // Validate category - redirect to homepage if invalid
    if (!VALID_CATEGORIES.includes(category)) {
        redirect('/');
    }

    const title = category.charAt(0).toUpperCase() + category.slice(1);

    return (
        <div>
            <header className="mb-10 text-center">
                <h1 className="text-4xl font-bold mb-4 capitalize text-gray-900 dark:text-gray-100">
                    {title} News
                </h1>
                <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </header>

            <NewsFeed category={category} />
        </div>
    );
}

// Generate static params for all valid categories
export async function generateStaticParams() {
    return VALID_CATEGORIES.map((category) => ({
        category: category,
    }));
}

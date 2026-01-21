import NewsFeed from '@/components/NewsFeed';
import AdsterraSlot from '@/components/AdsterraSlot';

export const revalidate = 3600; // Hourly updates

export default function Home() {
    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-red-600 to-red-900 bg-clip-text text-transparent">
                    Latest Headlines
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
                    Breaking news, global stories, and in-depth analysis from around the world.
                </p>
            </header>

            <div className="mb-10">
                <AdsterraSlot type="banner" format="728x90" />
            </div>

            <NewsFeed category="general" />

            <div className="mt-20">
                <AdsterraSlot type="native" />
            </div>
        </div>
    );
}

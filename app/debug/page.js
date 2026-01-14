import { getAllArticles } from '@/lib/articleStore';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function DebugPage() {
    const articles = getAllArticles(20);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-800">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            🔧 Debug Dashboard
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Monitor article generation and storage system
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                {articles.length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Total Articles Stored
                            </div>
                        </div>

                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                                {articles.filter(a => {
                                    const savedTime = new Date(a.savedAt).getTime();
                                    const hourAgo = Date.now() - (60 * 60 * 1000);
                                    return savedTime > hourAgo;
                                }).length}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Generated Last Hour
                            </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                                {new Set(articles.map(a => a.category)).size}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Active Categories
                            </div>
                        </div>
                    </div>

                    {/* Articles List */}
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Recent Articles
                        </h2>

                        {articles.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-400 mb-4">
                                    No articles generated yet
                                </p>
                                <Link
                                    href="/"
                                    className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Go to Homepage to Generate Articles
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {articles.map((article, index) => (
                                    <div
                                        key={article.slug}
                                        className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 uppercase">
                                                        {article.category}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                        Saved: {new Date(article.savedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <Link
                                                    href={`/article/${article.slug}`}
                                                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                >
                                                    {article.title}
                                                </Link>
                                                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                                                        {article.slug}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    Published
                                                </div>
                                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {new Date(article.pubDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* System Info */}
                    <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                            System Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <span className="text-gray-600 dark:text-gray-400">Storage Type:</span>
                                <span className="ml-2 font-mono text-gray-900 dark:text-white">File-based JSON</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <span className="text-gray-600 dark:text-gray-400">Revalidation:</span>
                                <span className="ml-2 font-mono text-gray-900 dark:text-white">3600s (1 hour)</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <span className="text-gray-600 dark:text-gray-400">Image Fallback:</span>
                                <span className="ml-2 font-mono text-gray-900 dark:text-white">Unsplash API</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                                <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                                <span className="ml-2 font-mono text-gray-900 dark:text-white">{new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-8 flex gap-4">
                        <Link
                            href="/"
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            ← Back to Homepage
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                        >
                            🔄 Refresh Data
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

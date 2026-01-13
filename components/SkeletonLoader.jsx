export default function SkeletonLoader() {
    return (
        <div className="animate-pulse space-y-4 rounded-xl border border-gray-200 dark:border-gray-800 p-6 bg-white dark:bg-gray-900">
            <div className="h-48 bg-gray-200 dark:bg-gray-800 rounded-lg w-full mb-4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            <div className="space-y-2 mt-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
            </div>
        </div>
    );
}

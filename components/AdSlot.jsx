export default function AdSlot({ position }) {
    return (
        <div className="w-full my-8 bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center min-h-[100px] border-2 border-dashed border-gray-300 dark:border-gray-700 animate-pulse-slow">
            <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Advertisement ({position})</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Replace with AdSense Script</p>
            </div>
        </div>
    );
}

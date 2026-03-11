export default function MainLoading() {
    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-gray-200 rounded-lg" />
                <div className="h-32 bg-gray-200 rounded-lg" />
                <div className="h-32 bg-gray-200 rounded-lg" />
            </div>
            <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded-lg" />
                <div className="h-24 bg-gray-200 rounded-lg" />
                <div className="h-24 bg-gray-200 rounded-lg" />
            </div>
        </div>
    );
}

export default function WorkspaceLoading() {
    return (
        <div className="p-6 space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-4 bg-gray-200 rounded w-72" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
                <div className="h-40 bg-gray-200 rounded-lg" />
                <div className="h-40 bg-gray-200 rounded-lg" />
                <div className="h-40 bg-gray-200 rounded-lg" />
            </div>
        </div>
    );
}

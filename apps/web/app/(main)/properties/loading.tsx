export default function PropertiesLoading() {
    return (
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
            <div className="text-center text-gray-500">
                <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
                매물을 불러오는 중...
            </div>
        </div>
    );
}

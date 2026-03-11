'use client';

export default function WorkspaceError({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h2>
            <p className="text-gray-500 mb-6 text-center">
                데이터를 불러오는 중 문제가 발생했습니다.
            </p>
            <button
                onClick={reset}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
                다시 시도
            </button>
        </div>
    );
}

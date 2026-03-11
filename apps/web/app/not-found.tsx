import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
            <h2 className="text-xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h2>
            <p className="text-gray-500 mb-6">요청하신 페이지가 존재하지 않습니다.</p>
            <Link
                href="/"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium active:scale-[0.98]"
            >
                홈으로 돌아가기
            </Link>
        </div>
    );
}

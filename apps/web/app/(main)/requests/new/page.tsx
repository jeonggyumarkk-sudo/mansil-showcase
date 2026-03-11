import { ClipboardList } from 'lucide-react';

export const metadata = { title: '매칭요청' };

export default function RequestsPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                <ClipboardList className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">매칭요청</h2>
            <p className="text-gray-400">현재 개발 중입니다</p>
        </div>
    );
}

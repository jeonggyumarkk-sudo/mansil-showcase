import { Users } from 'lucide-react';

export const metadata = {
    title: '고객 관리',
};

export default function CustomersPage() {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">고객 관리</h1>
                <p className="text-gray-500">등록된 고객을 관리하고 매칭 정보를 확인하세요.</p>
            </div>
            <div className="flex flex-col items-center justify-center h-[calc(100vh-16rem)] text-center">
                <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                    <Users className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">고객관리</h2>
                <p className="text-gray-400">현재 개발 중입니다</p>
            </div>
        </div>
    );
}

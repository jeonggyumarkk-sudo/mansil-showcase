import { MessageSquare } from 'lucide-react';

export const metadata = { title: '커뮤니티' };

export default function CommunityPage() {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                <MessageSquare className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">커뮤니티</h2>
            <p className="text-gray-400">현재 개발 중입니다</p>
        </div>
    );
}

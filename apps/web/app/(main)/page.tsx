import { Card, Button } from '@mansil/ui';
import { Plus, ClipboardList, MessageCircle, CheckCircle, CalendarDays, Building, Bell } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: '대시보드',
};

export default function Dashboard() {
    return (
        <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
                    <p className="text-gray-500">오늘도 좋은 거래 되세요</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Link href="/properties/register">
                        <Button className="flex-1 md:flex-none">
                            <Plus className="w-4 h-4 mr-2" />
                            매물 등록
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Quick Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: '등록 매물', value: '6,694', icon: ClipboardList, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
                    { label: '문의', value: '-', icon: MessageCircle, bgColor: 'bg-green-50', textColor: 'text-green-600' },
                    { label: '계약예정', value: '-', icon: CheckCircle, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
                    { label: '오늘일정', value: '-', icon: CalendarDays, bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
                ].map((stat) => (
                    <Card key={stat.label} className="p-4 flex flex-col items-center justify-center text-center gap-2">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor} ${stat.textColor}`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm text-gray-500">{stat.label}</span>
                        <span className="text-xl font-bold text-gray-900">{stat.value}</span>
                    </Card>
                ))}
            </section>

            {/* Empty state */}
            <section className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900">최근 매물</h2>
                    <Link href="/properties">
                        <Button variant="ghost" size="sm">매물지도 보기</Button>
                    </Link>
                </div>
                <Card>
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Building className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">매물지도에서 확인하세요</h3>
                        <p className="text-sm text-gray-500 mb-4">6,694건의 매물을 지도에서 탐색할 수 있습니다.</p>
                        <Link href="/properties">
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                매물지도 이동
                            </Button>
                        </Link>
                    </div>
                </Card>
            </section>

            {/* Notifications */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900">알림</h2>
                <Card>
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">새로운 알림이 없습니다</h3>
                        <p className="text-sm text-gray-500">새로운 문의나 일정이 생기면 여기에 표시됩니다.</p>
                    </div>
                </Card>
            </section>
        </div>
    );
}

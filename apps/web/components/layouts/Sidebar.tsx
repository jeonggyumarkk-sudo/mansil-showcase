'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Map as MapIcon,
    FileText,
    Users,
    MessageSquare,
    ClipboardList,
    Wallet,
    Calendar,
    LogOut,
} from 'lucide-react';

interface SidebarProps {
    className?: string;
}

const MENU_ITEMS = [
    { icon: LayoutDashboard, label: '홈', href: '/' },
    { icon: MapIcon, label: '매물지도', href: '/properties' },
    { icon: FileText, label: '계약관리', href: '/workspace/contracts' },
    { icon: Users, label: '고객관리', href: '/workspace/customers' },
    { icon: Wallet, label: '장부관리', href: '/workspace/ledger' },
    { icon: Calendar, label: '일정관리', href: '/workspace/schedule' },
    { icon: ClipboardList, label: '매칭요청', href: '/requests/new' },
    { icon: MessageSquare, label: '커뮤니티', href: '/community' },
];

export function Sidebar({ className = '' }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        document.cookie = 'access_token=; path=/; max-age=0';
        router.push('/login');
    };

    return (
        <aside className={`bg-white border-r border-gray-200 h-full flex flex-col ${className}`}>
            <div className="p-6">
                <h2 className="text-2xl font-bold tracking-tighter text-blue-600">mansil.</h2>
            </div>

            <nav className="flex-1 px-4 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex items-center gap-3 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-primary-50 text-primary-700 border-l-[3px] border-primary-600 pl-[13px] pr-4'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-4'
                                }`}
                        >
                            <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-100">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
                >
                    <LogOut className="w-5 h-5 text-gray-400" />
                    로그아웃
                </button>
            </div>
        </aside>
    );
}

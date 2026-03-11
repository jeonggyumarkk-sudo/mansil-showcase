'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Map as MapIcon,
    FileText,
    MessageSquare,
    Users
} from 'lucide-react';

interface BottomNavProps {
    className?: string;
}

const NAV_ITEMS = [
    { icon: LayoutDashboard, label: '홈', href: '/' },
    { icon: MapIcon, label: '지도', href: '/properties' },
    { icon: FileText, label: '계약', href: '/workspace/contracts' },
    { icon: MessageSquare, label: '커뮤니티', href: '/community' },
    { icon: Users, label: '고객', href: '/workspace/customers' },
];

export function BottomNav({ className = '' }: BottomNavProps) {
    const pathname = usePathname();

    return (
        <nav className={`bg-white border-t border-gray-200 pb-safe ${className}`}>
            <div className="flex justify-around items-center h-16">
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-primary-600' : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

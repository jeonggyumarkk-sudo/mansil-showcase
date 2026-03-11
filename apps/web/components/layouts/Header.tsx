'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { Button, Input } from '@mansil/ui';

interface HeaderProps {
    onMenuClick?: () => void;
    className?: string;
}

export function Header({ onMenuClick, className = '' }: HeaderProps) {
    return (
        <header className={`bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 lg:px-8 ${className}`}>
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="메뉴 열기"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <span className="lg:hidden text-lg font-bold text-primary-600">만실</span>

                <div className="hidden md:flex max-w-md w-full">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            placeholder="지역, 건물명, 매물번호 검색"
                            className="pl-10 w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="relative" aria-label="알림">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-4 w-2 h-2 bg-red-500 rounded-full border border-white" />
                </Button>
            </div>
        </header>
    );
}

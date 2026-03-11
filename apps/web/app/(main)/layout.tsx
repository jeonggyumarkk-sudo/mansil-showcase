'use client';

import { useState } from 'react';
import { Header } from '@/components/layouts/Header';
import { Sidebar } from '@/components/layouts/Sidebar';
import { BottomNav } from '@/components/layouts/BottomNav';

export default function MainLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50">
            <Header
                className="fixed top-0 left-0 right-0 z-20"
                onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            />

            <div className="flex pt-16 h-[calc(100vh)]">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 z-10">
                    <Sidebar />
                </div>

                {/* Mobile Sidebar Overlay */}
                <div
                    className={`lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={() => setMobileMenuOpen(false)}
                />
                <div className={`lg:hidden fixed left-0 top-16 bottom-0 w-64 z-40 transition-transform duration-300 ease-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <Sidebar />
                </div>

                {/* Main Content */}
                <main className="flex-1 lg:ml-64 pb-20 lg:pb-8 overflow-auto">
                    {children}
                    <footer className="mt-8 px-6 py-4 text-center text-xs text-gray-400 border-t border-gray-100">
                        <a href="/privacy" className="hover:text-gray-600 transition-colors">개인정보 처리방침</a>
                        <span className="mx-2">|</span>
                        <a href="/terms" className="hover:text-gray-600 transition-colors">이용약관</a>
                    </footer>
                </main>
            </div>

            {/* Mobile Bottom Nav */}
            <BottomNav className="lg:hidden fixed bottom-0 left-0 right-0 z-20" />
        </div>
    );
}

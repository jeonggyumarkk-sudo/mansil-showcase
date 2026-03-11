import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: '만실 - 부동산 관리 플랫폼',
        template: '%s | 만실',
    },
    description: '부동산 중개사를 위한 올인원 관리 플랫폼',
    openGraph: {
        title: '만실',
        description: '부동산 중개사를 위한 올인원 관리 플랫폼',
        locale: 'ko_KR',
        type: 'website',
    },
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <body className="antialiased font-sans">{children}</body>
        </html>
    );
}

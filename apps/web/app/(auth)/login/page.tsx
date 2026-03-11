'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@mansil/ui';
import { login } from '@/lib/api/auth';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await login(email, password);
            localStorage.setItem('access_token', data.access_token);
            document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
            router.push('/');
        } catch {
            setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-gray-900">로그인</h2>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        이메일
                    </label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="admin@mansil.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        비밀번호
                    </label>
                    <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••••"
                    />
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? '로그인 중...' : '로그인'}
                </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
                계정이 없으신가요?{' '}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                    회원가입
                </Link>
            </div>
        </Card>
    );
}

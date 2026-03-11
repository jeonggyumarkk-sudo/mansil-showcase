'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card } from '@mansil/ui';
import { register } from '@/lib/api/auth';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [privacyConsent, setPrivacyConsent] = useState(false);
    const [termsConsent, setTermsConsent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (formData.password.length < 8) {
            setError('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        setLoading(true);

        try {
            const data = await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                consents: [
                    { type: 'privacy_policy', version: '1.0', accepted: privacyConsent },
                    { type: 'terms_of_service', version: '1.0', accepted: termsConsent },
                ],
            });
            localStorage.setItem('access_token', data.access_token);
            document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
            router.push('/');
        } catch {
            setError('회원가입에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="p-8 space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-gray-900">회원가입</h2>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        이름
                    </label>
                    <Input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="홍길동"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        이메일
                    </label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="example@mansil.com"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        비밀번호
                    </label>
                    <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="8자 이상"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        비밀번호 확인
                    </label>
                    <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        placeholder="비밀번호를 다시 입력해주세요"
                    />
                </div>

                <div className="space-y-2">
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={privacyConsent}
                            onChange={(e) => setPrivacyConsent(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>
                            <a href="/privacy" target="_blank" className="text-primary-600 underline">개인정보 처리방침</a>에 동의합니다. (필수)
                        </span>
                    </label>
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={termsConsent}
                            onChange={(e) => setTermsConsent(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>
                            <a href="/terms" target="_blank" className="text-primary-600 underline">이용약관</a>에 동의합니다. (필수)
                        </span>
                    </label>
                </div>

                <Button type="submit" className="w-full h-11" disabled={loading || !privacyConsent || !termsConsent}>
                    {loading ? '가입 중...' : '회원가입'}
                </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
                이미 계정이 있으신가요?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                    로그인
                </Link>
            </div>
        </Card>
    );
}

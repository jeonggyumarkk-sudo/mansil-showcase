'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, FileUpload, Card } from '@mansil/ui';
import { createProperty } from '@/lib/api/properties';
import { PropertyType, TransactionType, PropertyStatus } from '@mansil/types';

export default function RegisterPropertyPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        address: '',
        detailAddress: '',
        type: PropertyType.ONE_ROOM,
        transactionType: TransactionType.MONTHLY,
        deposit: '',
        monthlyRent: '',
        maintenanceFee: '',
        area: '',
        floor: '',
        totalFloors: '',
        description: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = (): string | null => {
        if (!formData.title.trim()) return '매물 제목을 입력해주세요.';
        if (!formData.address.trim()) return '주소를 입력해주세요.';
        if (!formData.area || Number(formData.area) <= 0) return '전용면적은 0보다 커야 합니다.';
        if (!formData.floor || Number(formData.floor) <= 0) return '층수는 0보다 커야 합니다.';
        if (!formData.totalFloors || Number(formData.totalFloors) <= 0) return '전체 층수는 0보다 커야 합니다.';
        if (Number(formData.floor) > Number(formData.totalFloors)) return '해당 층은 전체 층보다 클 수 없습니다.';
        if (formData.deposit && Number(formData.deposit) < 0) return '보증금은 0 이상이어야 합니다.';
        if (formData.monthlyRent && Number(formData.monthlyRent) < 0) return '월세는 0 이상이어야 합니다.';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                transactionType: formData.transactionType,
                status: PropertyStatus.AVAILABLE,
                address: formData.address,
                roadAddress: formData.address,
                coordinates: { lat: 36.363, lng: 127.355 },
                deposit: String(Number(formData.deposit) || 0),
                monthlyRent: String(Number(formData.monthlyRent) || 0),
                maintenanceFee: String(Number(formData.maintenanceFee) || 0),
                areaPyeong: Number(formData.area),
                floor: Number(formData.floor),
                totalFloors: Number(formData.totalFloors),
                roomCount: 1,
                bathroomCount: 1,
            };

            await createProperty(payload);
            router.push('/properties');
            router.refresh();
        } catch {
            setError('매물 등록에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">매물 등록</h1>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">기본 정보</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">매물 제목 *</label>
                            <Input
                                name="title"
                                placeholder="예: 궁동 리모델링 풀옵션 원룸"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Select
                            label="매물 종류"
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            options={[
                                { label: '원룸', value: PropertyType.ONE_ROOM },
                                { label: '투룸', value: PropertyType.TWO_ROOM },
                                { label: '오피스텔', value: PropertyType.OFFICE },
                                { label: '아파트', value: PropertyType.APARTMENT },
                            ]}
                        />

                        <Select
                            label="거래 유형"
                            name="transactionType"
                            value={formData.transactionType}
                            onChange={handleChange}
                            options={[
                                { label: '월세', value: TransactionType.MONTHLY },
                                { label: '전세', value: TransactionType.JEONSE },
                                { label: '매매', value: TransactionType.SALE },
                            ]}
                        />
                    </div>
                </Card>

                {/* Location & Details */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">위치 및 상세 정보</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">주소 *</label>
                                <div className="flex gap-2">
                                    <Input
                                        name="address"
                                        placeholder="주소를 입력해주세요"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="flex-1"
                                        required
                                    />
                                    <Button type="button" variant="secondary">검색</Button>
                                </div>
                            </div>
                            <div className="col-span-2">
                                <Input
                                    name="detailAddress"
                                    placeholder="상세 주소 (동/호수)"
                                    value={formData.detailAddress}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input label="전용면적 (평) *" name="area" type="number" min="0.1" step="0.1" value={formData.area} onChange={handleChange} required />
                            <Input label="해당 층 *" name="floor" type="number" min="1" value={formData.floor} onChange={handleChange} required />
                            <Input label="전체 층 *" name="totalFloors" type="number" min="1" value={formData.totalFloors} onChange={handleChange} required />
                        </div>
                    </div>
                </Card>

                {/* Price */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">가격 정보</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            label="보증금 (만원)"
                            name="deposit"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.deposit}
                            onChange={handleChange}
                        />
                        <Input
                            label="월세 (만원)"
                            name="monthlyRent"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.monthlyRent}
                            onChange={handleChange}
                            disabled={formData.transactionType === TransactionType.JEONSE}
                        />
                        <Input
                            label="관리비 (만원)"
                            name="maintenanceFee"
                            type="number"
                            min="0"
                            placeholder="0"
                            value={formData.maintenanceFee}
                            onChange={handleChange}
                        />
                    </div>
                </Card>

                {/* Description & Images */}
                <Card className="p-6 space-y-4">
                    <h2 className="text-lg font-bold text-gray-800 border-b pb-2">설명 및 사진</h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">상세 설명</label>
                        <textarea
                            name="description"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg h-32 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="매물에 대한 상세한 설명을 적어주세요."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <FileUpload label="매물 사진 (최대 10장)" multiple accept="image/*" />
                </Card>

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="ghost"
                        className="flex-1"
                        onClick={() => router.back()}
                    >
                        취소
                    </Button>
                    <Button type="submit" className="flex-1" disabled={loading}>
                        {loading ? '등록 중...' : '매물 등록하기'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

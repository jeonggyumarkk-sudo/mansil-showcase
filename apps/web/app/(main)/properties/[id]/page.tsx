"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProperty } from "@/lib/api/properties";
import { Property } from "@mansil/types";
import { Button, Card, Badge } from "@mansil/ui";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, formatArea, formatTransactionType, formatPropertyType } from "@/lib/formatters";
import { Printer } from "lucide-react";
import { BuildingRegisterTab } from "@/components/features/property/BuildingRegisterTab";

export default function PropertyDetailPage() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState<'info' | 'register'>('info');
    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const id = params?.id as string | undefined;
        if (id) {
            fetchProperty(id)
                .then(setProperty)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [params?.id]);

    if (loading) return (
        <div className="flex items-center justify-center p-16">
            <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
    );
    if (!property) return (
        <div className="flex flex-col items-center justify-center py-16">
            <p className="text-gray-500 mb-4">매물을 찾을 수 없습니다.</p>
            <a href="/properties" className="text-primary-600 hover:text-primary-700 font-medium">목록으로 돌아가기</a>
        </div>
    );

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4 lg:p-8">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant={property.status === 'AVAILABLE' ? 'default' : 'occupied'}>
                            {property.status === 'AVAILABLE' ? '광고중' : '거래완료'}
                        </Badge>
                        <span className="text-sm text-gray-500">{formatPropertyType(property.type)}</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
                    <p className="text-xl font-semibold text-primary-700">
                        {formatTransactionType(property.transactionType)}{' '}
                        {property.deposit ? formatPrice(property.deposit) : 0}
                        {property.monthlyRent ? ` / ${formatPrice(property.monthlyRent)}` : ''}
                        {property.salePrice ? formatPrice(property.salePrice) : ''}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/properties/${property.id}/proposal`} target="_blank">
                        <Button variant="secondary" className="gap-2">
                            <Printer className="w-4 h-4" />
                            제안서 인쇄
                        </Button>
                    </Link>
                    <Button variant="primary">수정하기</Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    매물 정보
                </button>
                <button
                    onClick={() => setActiveTab('register')}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'register'
                        ? 'border-primary-600 text-primary-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    건축물대장
                </button>
            </div>

            {activeTab === 'info' ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Images */}
                        <div className="space-y-4">
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border relative">
                                {property.images && property.images.length > 0 ? (
                                    <Image
                                        src={property.images[0]}
                                        alt={property.title}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">이미지 없음</div>
                                )}
                            </div>
                        </div>

                        {/* Info Table */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold mb-4">매물 정보</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">소재지</span>
                                    <span>{property.address}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">면적</span>
                                    <span>{formatArea(property.areaPyeong)}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">층수</span>
                                    <span>{property.floor}층 / {property.totalFloors}층</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">구조</span>
                                    <span>방 {property.roomCount} / 욕실 {property.bathroomCount}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">관리비</span>
                                    <span>{property.maintenanceFee ? formatPrice(property.maintenanceFee) : '없음'}</span>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <Card className="p-6 mt-6">
                        <h3 className="text-lg font-bold mb-4">상세 설명</h3>
                        <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                            {property.description}
                        </p>
                    </Card>
                </>
            ) : (
                <BuildingRegisterTab propertyId={property.id} />
            )}
        </div>
    );
}

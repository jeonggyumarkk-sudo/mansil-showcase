"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchProperty } from "@/lib/api/properties";
import { Property } from "@mansil/types";
import Image from "next/image";
import { formatPrice, formatArea, formatTransactionType, formatPropertyType } from "@/lib/formatters";
import { MapPin, Phone, Building } from "lucide-react";

export default function ProposalPage() {
    const params = useParams();
    const [property, setProperty] = useState<Property | null>(null);

    useEffect(() => {
        const id = params?.id as string | undefined;
        if (id) {
            fetchProperty(id).then(setProperty);
        }
    }, [params?.id]);

    if (!property) return <div className="p-10">제안서 준비 중...</div>;

    return (
        <div className="bg-white min-h-screen p-8 print:p-0 font-sans text-gray-900">
            <style jsx global>{`
                @media print {
                    @page { margin: 0; size: A4; }
                    body { -webkit-print-color-adjust: exact; }
                    nav, aside, header, footer { display: none !important; }
                    .print-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999; background: white; }
                }
            `}</style>

            <div className="print-container max-w-[210mm] mx-auto bg-white">
                {/* Header */}
                <div className="border-b-4 border-primary-600 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <div className="text-primary-600 font-bold text-lg mb-1">만실 부동산 중개 서비스</div>
                        <h1 className="text-4xl font-extrabold tracking-tight">임대 제안서</h1>
                    </div>
                    <div className="text-right">
                        <div className="font-bold text-xl">담당 중개사</div>
                        <div className="flex items-center gap-2 text-gray-600 mt-1 justify-end">
                            <Phone className="w-4 h-4" />
                            <span>010-0000-0000</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {/* Left: Images */}
                    <div className="space-y-4">
                        <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative">
                            {property.images && property.images.length > 0 ? (
                                <Image
                                    src={property.images[0]}
                                    alt={property.title}
                                    fill
                                    className="object-cover"
                                    sizes="50vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">이미지 없음</div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="aspect-video bg-gray-100 rounded border"></div>
                            <div className="aspect-video bg-gray-100 rounded border"></div>
                        </div>
                    </div>

                    {/* Right: Key Info */}
                    <div>
                        <div className="mb-6">
                            <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-bold mb-2">
                                {formatPropertyType(property.type)}
                            </span>
                            <h2 className="text-3xl font-bold mb-2 break-keep leading-tight">{property.title}</h2>
                            <div className="flex items-center gap-2 text-gray-600 mb-4">
                                <MapPin className="w-4 h-4" />
                                <span>{property.address}</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                            <div className="flex justify-between items-end border-b border-gray-200 pb-3">
                                <span className="text-gray-500 font-medium">거래 종류</span>
                                <span className="text-xl font-bold text-gray-900">{formatTransactionType(property.transactionType)}</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-gray-200 pb-3">
                                <span className="text-gray-500 font-medium">가격</span>
                                <span className="text-xl font-bold text-primary-700">
                                    {property.deposit ? formatPrice(property.deposit) : ''}
                                    {property.deposit && property.monthlyRent ? ' / ' : ''}
                                    {property.monthlyRent ? formatPrice(property.monthlyRent) : ''}
                                    {property.salePrice ? formatPrice(property.salePrice) : ''}
                                </span>
                            </div>
                            <div className="flex justify-between items-end pb-1">
                                <span className="text-gray-500 font-medium">관리비</span>
                                <span className="text-lg font-semibold">{property.maintenanceFee ? formatPrice(property.maintenanceFee) : '없음'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details Table */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        매물 상세 정보
                    </h3>
                    <table className="w-full text-sm border-t-2 border-primary-600">
                        <tbody>
                            <tr className="border-b">
                                <th className="bg-gray-50 py-3 px-4 text-left font-medium w-32">전용 면적</th>
                                <td className="py-3 px-4">{formatArea(property.areaPyeong)}</td>
                                <th className="bg-gray-50 py-3 px-4 text-left font-medium w-32">해당 층 / 총 층</th>
                                <td className="py-3 px-4">{property.floor}층 / {property.totalFloors}층</td>
                            </tr>
                            <tr className="border-b">
                                <th className="bg-gray-50 py-3 px-4 text-left font-medium">방 / 욕실</th>
                                <td className="py-3 px-4">{property.roomCount}개 / {property.bathroomCount}개</td>
                                <th className="bg-gray-50 py-3 px-4 text-left font-medium">방향</th>
                                <td className="py-3 px-4">남향 (거실 기준)</td>
                            </tr>
                            <tr className="border-b">
                                <th className="bg-gray-50 py-3 px-4 text-left font-medium">주차</th>
                                <td className="py-3 px-4">가능 (자주식)</td>
                                <th className="bg-gray-50 py-3 px-4 text-left font-medium">입주 가능일</th>
                                <td className="py-3 px-4">즉시 협의</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4">상세 설명</h3>
                    <div className="bg-white border rounded-lg p-6 text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {property.description}
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4">위치</h3>
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border">
                        지도 이미지 (API 연동 필요)
                    </div>
                    <div className="mt-2 text-sm text-gray-500 text-center">{property.roadAddress || property.address}</div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-400 border-t pt-8">
                    <p>본 제안서는 {new Date().toLocaleDateString('ko-KR')} 기준이며, 거래 현황에 따라 변동될 수 있습니다.</p>
                    <p>만실(Mansil) 부동산 중개 플랫폼</p>
                </div>
            </div>
        </div>
    );
}

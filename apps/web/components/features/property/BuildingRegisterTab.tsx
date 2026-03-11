import { Card, Badge } from "@mansil/ui";
import { FileText, AlertTriangle } from "lucide-react";

interface BuildingRegisterTabProps {
    propertyId: string;
}

export function BuildingRegisterTab({ propertyId }: BuildingRegisterTabProps) {
    // Mock data - clearly labeled
    const data = {
        mainUsage: "단독주택 (다가구주택)",
        structure: "철근콘크리트구조",
        roof: "철근콘크리트지붕",
        height: "12m",
        groundFloors: 4,
        undergroundFloors: 0,
        parking: "옥외 4대",
        elevator: "승용 1대",
        useApprovalDate: "2018-05-20",
        officialPrice: "215,000,000원 (2025.01.01 기준)",
        violation: false,
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    <div>
                        <div className="font-bold text-yellow-900">목업 데이터 (개발 중)</div>
                        <div className="text-xs text-yellow-700">실제 건축물대장 API 연동 전 샘플 데이터입니다.</div>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <div>
                        <div className="font-bold text-blue-900">건축물대장 (표제부)</div>
                        <div className="text-xs text-blue-700">발급일시: {new Date().toLocaleString('ko-KR')}</div>
                    </div>
                </div>
            </div>

            <Card className="p-6">
                <h3 className="text-lg font-bold mb-4 border-b pb-2">건축물 현황</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">주용도</span>
                        <span className="font-semibold">{data.mainUsage}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">주구조</span>
                        <span className="font-semibold">{data.structure}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">지붕</span>
                        <span className="font-semibold">{data.roof}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">높이</span>
                        <span className="font-semibold">{data.height}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">층수</span>
                        <span className="font-semibold">지상 {data.groundFloors}층 / 지하 {data.undergroundFloors}층</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">주차장</span>
                        <span className="font-semibold">{data.parking}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">승강기</span>
                        <span className="font-semibold">{data.elevator}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">사용승인일</span>
                        <span className="font-semibold">{data.useApprovalDate}</span>
                    </div>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">위반건축물 여부</span>
                        {data.violation ? (
                            <span className="text-red-600 font-bold">위반 등재</span>
                        ) : (
                            <span className="text-green-600 font-bold">해당 없음</span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-600 font-medium">개별주택가격</span>
                        <span className="font-bold text-gray-900">{data.officialPrice}</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}

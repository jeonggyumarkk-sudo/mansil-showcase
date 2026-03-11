'use client';

import { useState } from 'react';
import { Contract } from '@/lib/api/contracts';
import { Card, Button } from '@mansil/ui';
import { Plus, FileText, Calendar } from 'lucide-react';
import Link from 'next/link';

interface ContractListProps {
    initialContracts: Contract[];
}

export function ContractList({ initialContracts }: ContractListProps) {
    const [contracts] = useState<Contract[]>(initialContracts);

    const statusLabel = (status: string) => {
        const map: Record<string, string> = {
            DRAFT: '초안',
            SIGNED: '서명완료',
            COMPLETED: '완료',
            CANCELLED: '취소',
        };
        return map[status] || status;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">계약 목록 ({contracts.length})</h2>
                <Link href="/workspace/contracts/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        계약 작성
                    </Button>
                </Link>
            </div>

            {contracts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    등록된 계약이 없습니다.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {contracts.map((contract) => (
                        <Card key={contract.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">
                                            {contract.property?.title || '매물 정보 없음'}
                                        </h3>
                                        <span className={`px-2 py-0.5 rounded text-xs ${contract.status === 'SIGNED' ? 'bg-green-100 text-green-700' :
                                            contract.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                contract.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                            }`}>
                                            {statusLabel(contract.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        {contract.customer?.name} ({contract.type})
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                {contract.startDate && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(contract.startDate).toLocaleDateString('ko-KR')} ~ {contract.endDate ? new Date(contract.endDate).toLocaleDateString('ko-KR') : ''}
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button variant="secondary" size="sm" className="flex-1">
                                    <FileText className="w-3 h-3 mr-1" /> 상세 보기
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

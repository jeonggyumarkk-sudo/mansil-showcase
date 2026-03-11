'use client';

import { useState } from 'react';
import { Customer } from '@/lib/api/customers';
import { Card, Button } from '@mansil/ui';
import { Plus, Phone, MessageCircle, Calendar } from 'lucide-react';

interface CustomerListProps {
    initialCustomers: Customer[];
}

export function CustomerList({ initialCustomers }: CustomerListProps) {
    const [customers] = useState<Customer[]>(initialCustomers);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">고객 목록 ({customers.length})</h2>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    고객 등록
                </Button>
            </div>

            {customers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    등록된 고객이 없습니다.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {customers.map((customer) => (
                        <Card key={customer.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{customer.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs ${customer.priority === 'HOT' ? 'bg-red-100 text-red-700' :
                                            customer.priority === 'WARM' ? 'bg-orange-100 text-orange-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {customer.priority}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{customer.status}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Phone className="w-4 h-4 mr-2" />
                                    {customer.phone || '전화번호 없음'}
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    {customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString('ko-KR') : '-'}
                                </div>
                            </div>

                            <div className="mt-4 flex gap-2">
                                <Button variant="secondary" size="sm" className="flex-1">
                                    <Phone className="w-3 h-3 mr-1" /> 전화
                                </Button>
                                <Button variant="secondary" size="sm" className="flex-1">
                                    <MessageCircle className="w-3 h-3 mr-1" /> 문자
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

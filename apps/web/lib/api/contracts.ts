import { client } from './client';
import { Property, Customer } from '@mansil/types';


export interface Contract {
    id: string;
    propertyId: string;
    customerId: string;
    agentId: string;

    property?: Property;
    customer?: Customer;

    type: string; // RENT, JEONSE, SALE
    status: 'DRAFT' | 'SIGNED' | 'COMPLETED' | 'CANCELLED';

    deposit?: number;
    monthlyRent?: number;
    salePrice?: number;
    commission?: number;

    contractDate: string;
    startDate?: string;
    endDate?: string;
    moveInDate?: string;

    note?: string;
    pdfUrl?: string;

    createdAt: string;
    updatedAt: string;
}

export type CreateContractData = Partial<Contract>;
export type UpdateContractData = Partial<Contract>;

export async function fetchContracts(): Promise<Contract[]> {
    const response = await client.get<{ data: Contract[] }>('/contracts');
    return response.data.data;
}

export async function fetchContract(id: string): Promise<Contract> {
    const response = await client.get<Contract>(`/contracts/${id}`);
    return response.data;
}

export async function createContract(data: CreateContractData): Promise<Contract> {
    const response = await client.post<Contract>('/contracts', data);
    return response.data;
}

export async function updateContract(id: string, data: UpdateContractData): Promise<Contract> {
    const response = await client.patch<Contract>(`/contracts/${id}`, data);
    return response.data;
}

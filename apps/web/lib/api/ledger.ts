import { client } from './client';

export type LedgerTransaction = {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    date: string;
    description?: string;
    contractId?: string;
    agentId: string;
};

export type CreateLedgerDto = {
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: string;
    date: string;
    description?: string;
    contractId?: string;
};

export async function fetchLedger(): Promise<LedgerTransaction[]> {
    const res = await client.get<{ data: LedgerTransaction[] }>('/ledger');
    return res.data.data;
}

export async function createLedgerTransaction(data: CreateLedgerDto): Promise<LedgerTransaction> {
    const res = await client.post<LedgerTransaction>('/ledger', data);
    return res.data;
}

export async function fetchLedgerStats(year: number, month: number) {
    const res = await client.get<{ income: number; expense: number; net: number }>(`/ledger/stats?year=${year}&month=${month}`);
    return res.data;
}

export enum LedgerType {
    INCOME = 'INCOME',
    EXPENSE = 'EXPENSE',
}

export interface LedgerTransaction {
    id: string;
    type: LedgerType;
    amount: string;
    category: string;
    date: string;
    description?: string | null;
    contractId?: string | null;
    agentId: string;
    createdAt: string;
    updatedAt: string;
}

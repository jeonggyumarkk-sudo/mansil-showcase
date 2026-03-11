export enum ContractType {
    RENT = 'RENT',
    JEONSE = 'JEONSE',
    SALE = 'SALE',
}

export enum ContractStatus {
    DRAFT = 'DRAFT',
    SIGNED = 'SIGNED',
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface Contract {
    id: string;
    propertyId: string;
    customerId: string;
    agentId: string;
    type: ContractType;
    status: ContractStatus;
    deposit?: string | null;
    monthlyRent?: string | null;
    salePrice?: string | null;
    commission?: string | null;
    contractDate: string;
    startDate?: string | null;
    endDate?: string | null;
    moveInDate?: string | null;
    note?: string | null;
    pdfUrl?: string | null;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

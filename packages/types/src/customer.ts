export enum CustomerStatus {
    ACTIVE = 'ACTIVE',
    CONTRACTED = 'CONTRACTED',
    INACTIVE = 'INACTIVE',
}

export enum CustomerPriority {
    HOT = 'HOT',
    WARM = 'WARM',
    COLD = 'COLD',
}

export interface CustomerPreferences {
    type?: string;
    maxDeposit?: number;
    maxRent?: number;
    budget?: number;
    preferredArea?: string;
    [key: string]: unknown;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    status: CustomerStatus;
    priority: CustomerPriority;
    preferences?: string | null; // JSON string (parsed as CustomerPreferences)
    notes?: string | null;
    nextFollowupDate?: string | null;
    agentId: string;
    deletedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

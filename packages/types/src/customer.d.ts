export interface Customer {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    status: 'ACTIVE' | 'CONTRACTED' | 'INACTIVE';
    priority: 'HOT' | 'WARM' | 'COLD';
    preferences?: string;
    notes?: string;
    nextFollowupDate?: string;
    agentId: string;
    createdAt: string;
    updatedAt: string;
}

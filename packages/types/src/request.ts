import { User } from './user';

export enum RequestStatus {
    PENDING = 'PENDING',
    MATCHED = 'MATCHED',
    CLOSED = 'CLOSED',
}

export interface ClientRequest {
    id: string;
    status: RequestStatus | string;
    clientName: string;
    clientPhone: string;
    minDeposit?: number | null;
    maxDeposit?: number | null;
    minRent?: number | null;
    maxRent?: number | null;
    preferredLocations?: string | null;
    preferredTypes?: string | null;
    agentId: string;
    agent?: User;
    createdAt: Date;
    updatedAt: Date;
}

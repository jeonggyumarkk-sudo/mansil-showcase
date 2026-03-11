import { client } from './client';
import { ClientRequest, Property } from '@mansil/types';

export async function createRequest(data: Partial<ClientRequest>): Promise<ClientRequest> {
    const response = await client.post<ClientRequest>('/requests', data);
    return response.data;
}

export async function fetchRequests(): Promise<ClientRequest[]> {
    try {
        const response = await client.get<{ data: ClientRequest[] }>('/requests');
        return response.data.data;
    } catch {
        return [];
    }
}

export async function fetchRequestMatches(id: string): Promise<Property[]> {
    try {
        const response = await client.get<Property[]>(`/requests/${id}/matches`);
        return response.data;
    } catch {
        return [];
    }
}

export async function fetchRequest(id: string): Promise<ClientRequest | null> {
    try {
        const response = await client.get<ClientRequest>(`/requests/${id}`);
        return response.data;
    } catch {
        return null;
    }
}

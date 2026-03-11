import { client } from './client';
import { Property } from '@mansil/types';

export type { Property };

export async function fetchProperties(params?: { page?: number; limit?: number }): Promise<Property[]> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    const response = await client.get<{ data: Property[] }>(`/properties?${query.toString()}`);
    return response.data.data;
}

export async function fetchProperty(id: string): Promise<Property> {
    const response = await client.get<Property>(`/properties/${id}`);
    return response.data;
}

export async function createProperty(data: Partial<Property>): Promise<Property> {
    const response = await client.post<Property>('/properties', data);
    return response.data;
}

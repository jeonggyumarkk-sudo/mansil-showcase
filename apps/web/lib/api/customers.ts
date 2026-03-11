import { client } from './client';
import { Customer } from '@mansil/types';

export type { Customer };


export type CreateCustomerData = Pick<Customer, 'name' | 'phone' | 'email' | 'status' | 'priority' | 'preferences' | 'notes'>;
export type UpdateCustomerData = Partial<CreateCustomerData>;

export async function fetchCustomers(status?: string): Promise<Customer[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);

    const response = await client.get<{ data: Customer[] }>(`/customers?${params.toString()}`);
    return response.data.data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
    const response = await client.get<Customer>(`/customers/${id}`);
    return response.data;
}

export async function createCustomer(data: CreateCustomerData): Promise<Customer> {
    const response = await client.post<Customer>('/customers', data);
    return response.data;
}

export async function updateCustomer(id: string, data: UpdateCustomerData): Promise<Customer> {
    const response = await client.patch<Customer>(`/customers/${id}`, data);
    return response.data;
}

export async function deleteCustomer(id: string): Promise<void> {
    await client.delete(`/customers/${id}`);
}

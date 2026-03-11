import { client } from './client';

interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

interface ConsentItem {
    type: string;
    version: string;
    accepted: boolean;
}

interface RegisterData {
    email: string;
    password: string;
    name: string;
    consents: ConsentItem[];
}

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
}

export async function register(data: RegisterData): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/register', data);
    return response.data;
}

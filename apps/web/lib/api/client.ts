const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(method: RequestMethod, url: string, data?: unknown): Promise<{ data: T }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
        signal: controller.signal,
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    // Handle Access Token (Client-side only)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('access_token');
        if (token) {
            options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
        }
    }

    try {
        const res = await fetch(`${API_BASE_URL}${url}`, options);

        // Handle 401 - clear token and redirect to login
        if (res.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem('access_token');
                window.location.href = '/login';
            }
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }

        if (!res.ok) {
            let errorMsg = 'API 요청에 실패했습니다';
            try {
                const errorData = await res.json();
                errorMsg = errorData.message || errorData.error || errorMsg;
            } catch { }
            throw new Error(errorMsg);
        }

        const responseData = await res.json();
        return { data: responseData };
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요.');
        }
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export const client = {
    get: <T>(url: string) => request<T>('GET', url),
    post: <T>(url: string, data: unknown) => request<T>('POST', url, data),
    put: <T>(url: string, data: unknown) => request<T>('PUT', url, data),
    patch: <T>(url: string, data: unknown) => request<T>('PATCH', url, data),
    delete: <T>(url: string) => request<T>('DELETE', url),
};

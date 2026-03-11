import { client } from './client';

export interface PostAuthor {
    name: string;
    id?: string;
}

export interface PostComment {
    id: string;
    content: string;
    author: PostAuthor;
    createdAt: string;
}

export interface CommunityPost {
    id: string;
    title: string;
    content: string;
    category: string;
    views: number;
    author: PostAuthor;
    comments?: PostComment[];
    _count?: { comments: number };
    createdAt: string;
    updatedAt: string;
}

export async function fetchPosts(category?: string): Promise<CommunityPost[]> {
    try {
        const response = await client.get<{ data: CommunityPost[] }>(`/posts?category=${category || 'ALL'}`);
        return response.data.data;
    } catch {
        return [];
    }
}

export async function fetchPost(id: string): Promise<CommunityPost | null> {
    try {
        const response = await client.get<CommunityPost>(`/posts/${id}`);
        return response.data;
    } catch {
        return null;
    }
}

export async function createPost(data: { title: string; content: string; category: string }): Promise<CommunityPost> {
    const response = await client.post<CommunityPost>('/posts', data);
    return response.data;
}

export async function createComment(postId: string, content: string): Promise<PostComment> {
    const response = await client.post<PostComment>(`/posts/${postId}/comments`, { content });
    return response.data;
}

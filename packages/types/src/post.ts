export enum PostCategory {
    QNA = 'QNA',
    NAENWAYO = 'NAENWAYO',
    NOTICE = 'NOTICE',
    FREE = 'FREE',
}

export interface Post {
    id: string;
    title: string;
    content: string;
    category: PostCategory;
    views: number;
    authorId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Comment {
    id: string;
    content: string;
    postId: string;
    authorId?: string | null;
    createdAt: string;
    updatedAt: string;
}

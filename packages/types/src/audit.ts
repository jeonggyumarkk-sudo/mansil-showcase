export interface AuditLog {
    id: number;
    entityType: string;
    entityId: string;
    action: string;
    changes?: string | null;
    userId: string;
    createdAt: string;
}

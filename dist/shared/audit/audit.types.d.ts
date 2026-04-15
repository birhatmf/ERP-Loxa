export type AuditEntryKind = 'http_request' | 'domain_action';
export interface AuditLogEntry {
    id?: string;
    kind: AuditEntryKind;
    action: string;
    message: string;
    userId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    method?: string | null;
    path?: string | null;
    statusCode?: number | null;
    durationMs?: number | null;
    ip?: string | null;
    metadata?: Record<string, unknown>;
    occurredAt?: Date;
}
//# sourceMappingURL=audit.types.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteAuditLogRepository = void 0;
const types_1 = require("@shared/types");
class SqliteAuditLogRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async save(entry) {
        await this.knex('audit_logs').insert(this.toPersistence(entry));
    }
    async findAll() {
        const rows = await this.knex('audit_logs').orderBy('occurred_at', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    toDomain(row) {
        return {
            id: row.id,
            kind: row.kind,
            action: row.action,
            message: row.message,
            userId: row.user_id,
            entityType: row.entity_type,
            entityId: row.entity_id,
            method: row.method,
            path: row.path,
            statusCode: row.status_code != null ? Number(row.status_code) : null,
            durationMs: row.duration_ms != null ? Number(row.duration_ms) : null,
            ip: row.ip,
            metadata: row.metadata_json ? JSON.parse(row.metadata_json) : undefined,
            occurredAt: row.occurred_at ? new Date(row.occurred_at) : undefined,
        };
    }
    toPersistence(entry) {
        return {
            id: entry.id ?? (0, types_1.generateId)(),
            kind: entry.kind,
            action: entry.action,
            message: entry.message,
            user_id: entry.userId ?? null,
            entity_type: entry.entityType ?? null,
            entity_id: entry.entityId ?? null,
            method: entry.method ?? null,
            path: entry.path ?? null,
            status_code: entry.statusCode ?? null,
            duration_ms: entry.durationMs ?? null,
            ip: entry.ip ?? null,
            metadata_json: entry.metadata ? JSON.stringify(entry.metadata) : null,
            occurred_at: (entry.occurredAt ?? new Date()).toISOString(),
        };
    }
}
exports.SqliteAuditLogRepository = SqliteAuditLogRepository;
//# sourceMappingURL=sqlite-audit-log.repository.js.map
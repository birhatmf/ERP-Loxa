import { Knex } from 'knex';
import { AuditLogEntry } from '@shared/audit/audit.types';
import { IAuditLogRepository } from '@shared/audit/audit.repository';
import { generateId } from '@shared/types';

export class SqliteAuditLogRepository implements IAuditLogRepository {
  constructor(private knex: Knex) {}

  async save(entry: AuditLogEntry): Promise<void> {
    await this.knex('audit_logs').insert(this.toPersistence(entry));
  }

  async findAll(): Promise<AuditLogEntry[]> {
    const rows = await this.knex('audit_logs').orderBy('occurred_at', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  private toDomain(row: any): AuditLogEntry {
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

  private toPersistence(entry: AuditLogEntry): Record<string, any> {
    return {
      id: entry.id ?? generateId(),
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

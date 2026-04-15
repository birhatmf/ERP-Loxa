import { logger } from '@shared/logger';
import { AuditLogEntry } from './audit.types';
import { IAuditLogRepository } from './audit.repository';
import { generateId } from '@shared/types';

export class AuditService {
  constructor(private auditRepo: IAuditLogRepository) {}

  async record(entry: AuditLogEntry): Promise<void> {
    try {
      const auditEntry: AuditLogEntry = {
        ...entry,
        id: entry.id ?? generateId(),
        occurredAt: entry.occurredAt ?? new Date(),
      };
      await this.auditRepo.save(auditEntry);
    } catch (error: any) {
      logger.error('Failed to persist audit log', {
        error: error?.message ?? String(error),
        action: entry.action,
        kind: entry.kind,
      });
    }
  }

  async recordHttpRequest(entry: Omit<AuditLogEntry, 'kind' | 'message' | 'action'> & {
    message?: string;
  }): Promise<void> {
    await this.record({
      ...entry,
      kind: 'http_request',
      action: 'http.request',
      message: entry.message ?? `${entry.method ?? '-'} ${entry.path ?? '-'}`,
    });
  }

  async recordDomainAction(entry: Omit<AuditLogEntry, 'kind'> & {
    message?: string;
  }): Promise<void> {
    await this.record({
      ...entry,
      kind: 'domain_action',
      message: entry.message ?? entry.action,
    });
  }
}

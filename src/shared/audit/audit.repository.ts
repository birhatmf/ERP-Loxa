import { AuditLogEntry } from './audit.types';

export interface IAuditLogRepository {
  save(entry: AuditLogEntry): Promise<void>;
  findAll(): Promise<AuditLogEntry[]>;
}


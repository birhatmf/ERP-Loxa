import { Knex } from 'knex';
import { AuditLogEntry } from '@shared/audit/audit.types';
import { IAuditLogRepository } from '@shared/audit/audit.repository';
export declare class SqliteAuditLogRepository implements IAuditLogRepository {
    private knex;
    constructor(knex: Knex);
    save(entry: AuditLogEntry): Promise<void>;
    findAll(): Promise<AuditLogEntry[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-audit-log.repository.d.ts.map
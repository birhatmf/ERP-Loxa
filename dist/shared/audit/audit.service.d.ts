import { AuditLogEntry } from './audit.types';
import { IAuditLogRepository } from './audit.repository';
export declare class AuditService {
    private auditRepo;
    constructor(auditRepo: IAuditLogRepository);
    record(entry: AuditLogEntry): Promise<void>;
    recordHttpRequest(entry: Omit<AuditLogEntry, 'kind' | 'message' | 'action'> & {
        message?: string;
    }): Promise<void>;
    recordDomainAction(entry: Omit<AuditLogEntry, 'kind'> & {
        message?: string;
    }): Promise<void>;
}
//# sourceMappingURL=audit.service.d.ts.map
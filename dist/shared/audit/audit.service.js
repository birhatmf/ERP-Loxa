"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const logger_1 = require("../logger");
const types_1 = require("../types");
class AuditService {
    auditRepo;
    constructor(auditRepo) {
        this.auditRepo = auditRepo;
    }
    async record(entry) {
        try {
            const auditEntry = {
                ...entry,
                id: entry.id ?? (0, types_1.generateId)(),
                occurredAt: entry.occurredAt ?? new Date(),
            };
            await this.auditRepo.save(auditEntry);
        }
        catch (error) {
            logger_1.logger.error('Failed to persist audit log', {
                error: error?.message ?? String(error),
                action: entry.action,
                kind: entry.kind,
            });
        }
    }
    async recordHttpRequest(entry) {
        await this.record({
            ...entry,
            kind: 'http_request',
            action: 'http.request',
            message: entry.message ?? `${entry.method ?? '-'} ${entry.path ?? '-'}`,
        });
    }
    async recordDomainAction(entry) {
        await this.record({
            ...entry,
            kind: 'domain_action',
            message: entry.message ?? entry.action,
        });
    }
}
exports.AuditService = AuditService;
//# sourceMappingURL=audit.service.js.map
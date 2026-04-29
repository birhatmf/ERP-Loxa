import { Money, EventBus } from '../../../shared/types';
import { Check } from '../entities/check.entity';
import { ICheckRepository } from '../repositories/check.repository';
import { AuditService } from '../../../shared/audit/audit.service';
/**
 * CheckService - Domain Service
 * Manages check lifecycle and due date monitoring.
 */
export declare class CheckService {
    private checkRepo;
    private eventBus;
    private auditService;
    constructor(checkRepo: ICheckRepository, eventBus: EventBus, auditService: AuditService);
    /**
     * Get all overdue checks and emit events.
     * Should be run periodically (e.g., daily job).
     */
    processOverdueChecks(): Promise<Check[]>;
    /**
     * Get checks due within the next N days.
     */
    getUpcomingDue(days?: number): Promise<Check[]>;
    /**
     * Calculate total pending amount by type.
     */
    calculatePendingTotals(): Promise<{
        received: Money;
        given: Money;
        net: Money;
    }>;
    /**
     * Get check summary for a period.
     */
    getSummary(from: Date, to: Date): Promise<{
        totalReceived: Money;
        totalGiven: Money;
        paidReceived: Money;
        paidGiven: Money;
        pendingReceived: Money;
        pendingGiven: Money;
        bouncedCount: number;
    }>;
}
//# sourceMappingURL=check.service.d.ts.map
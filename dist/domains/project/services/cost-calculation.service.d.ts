import { Money, EventBus } from '../../../shared/types';
import { Project } from '../entities/project.entity';
import { AuditService } from '../../../shared/audit/audit.service';
/**
 * CostCalculationService - Domain Service
 * Calculates project costs and margins.
 */
export declare class CostCalculationService {
    private eventBus;
    private auditService;
    constructor(eventBus: EventBus, auditService: AuditService);
    /**
     * Calculate and emit cost breakdown for a project.
     */
    calculateAndEmit(project: Project): Promise<{
        totalCost: Money;
        totalPrice: Money;
        profitMargin: Money;
        profitMarginPercentage: number;
    }>;
    /**
     * Calculate cost per item type (grouped by material).
     */
    calculateCostByMaterial(project: Project): Map<string, Money>;
}
//# sourceMappingURL=cost-calculation.service.d.ts.map
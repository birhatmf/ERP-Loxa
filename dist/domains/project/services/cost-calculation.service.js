"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostCalculationService = void 0;
const project_events_1 = require("../events/project.events");
/**
 * CostCalculationService - Domain Service
 * Calculates project costs and margins.
 */
class CostCalculationService {
    eventBus;
    auditService;
    constructor(eventBus, auditService) {
        this.eventBus = eventBus;
        this.auditService = auditService;
    }
    /**
     * Calculate and emit cost breakdown for a project.
     */
    async calculateAndEmit(project) {
        const totalCost = project.totalCost;
        const totalPrice = project.totalPrice;
        const profitMargin = totalPrice.subtract(totalCost);
        const profitMarginPercentage = totalPrice.isZero()
            ? 0
            : (profitMargin.amount / totalPrice.amount) * 100;
        const event = new project_events_1.ProjectCostCalculatedEvent(project.id, totalCost, totalPrice, profitMargin);
        await this.eventBus.publish(event);
        void this.auditService.recordDomainAction({
            action: 'project.cost.calculated',
            message: `Project cost calculated for ${project.id}`,
            entityType: 'project',
            entityId: project.id,
            userId: null,
            metadata: {
                projectId: project.id,
                totalCost: totalCost.amount,
                totalPrice: totalPrice.amount,
                profitMargin: profitMargin.amount,
                profitMarginPercentage,
            },
        });
        return {
            totalCost,
            totalPrice,
            profitMargin,
            profitMarginPercentage,
        };
    }
    /**
     * Calculate cost per item type (grouped by material).
     */
    calculateCostByMaterial(project) {
        const costMap = new Map();
        for (const item of project.items) {
            const existing = costMap.get(item.materialId);
            if (existing) {
                costMap.set(item.materialId, existing.add(item.totalPrice));
            }
            else {
                costMap.set(item.materialId, item.totalPrice);
            }
        }
        return costMap;
    }
}
exports.CostCalculationService = CostCalculationService;
//# sourceMappingURL=cost-calculation.service.js.map
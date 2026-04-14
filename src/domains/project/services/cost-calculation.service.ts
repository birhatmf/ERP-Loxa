import { Money, EventBus } from '@shared/types';
import { Project } from '../entities/project.entity';
import { ProjectCostCalculatedEvent } from '../events/project.events';

/**
 * CostCalculationService - Domain Service
 * Calculates project costs and margins.
 */
export class CostCalculationService {
  constructor(private eventBus: EventBus) {}

  /**
   * Calculate and emit cost breakdown for a project.
   */
  async calculateAndEmit(project: Project): Promise<{
    totalCost: Money;
    totalPrice: Money;
    profitMargin: Money;
    profitMarginPercentage: number;
  }> {
    const totalCost = project.totalCost;
    const totalPrice = project.totalPrice;
    const profitMargin = totalPrice.subtract(totalCost);

    const profitMarginPercentage = totalPrice.isZero()
      ? 0
      : (profitMargin.amount / totalPrice.amount) * 100;

    const event = new ProjectCostCalculatedEvent(
      project.id,
      totalCost,
      totalPrice,
      profitMargin
    );

    await this.eventBus.publish(event);

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
  calculateCostByMaterial(project: Project): Map<string, Money> {
    const costMap = new Map<string, Money>();

    for (const item of project.items) {
      const existing = costMap.get(item.materialId);
      if (existing) {
        costMap.set(item.materialId, existing.add(item.totalPrice));
      } else {
        costMap.set(item.materialId, item.totalPrice);
      }
    }

    return costMap;
  }
}

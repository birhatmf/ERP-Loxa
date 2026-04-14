import { EventBus } from '@shared/types';
import { Material, StockService, Unit } from '@domains/inventory';
import { IMaterialRepository } from '@domains/inventory';

/**
 * CreateMaterial Use Case
 * Creates a new material in the inventory catalog.
 */
export class CreateMaterial {
  constructor(
    private materialRepo: IMaterialRepository,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    name: string;
    unit: Unit;
    minStockLevel: number;
  }): Promise<Material> {
    // Check for duplicates
    const existing = await this.materialRepo.findByName(params.name);
    if (existing) {
      throw new Error(`Material already exists: ${params.name}`);
    }

    const material = Material.create({
      name: params.name,
      unit: params.unit,
      minStockLevel: params.minStockLevel,
    });

    await this.materialRepo.save(material);
    await this.eventBus.publishAll(material.domainEvents);
    material.clearEvents();

    return material;
  }
}

/**
 * AddStock Use Case
 * Handles purchasing material (stock IN).
 * Creates both a StockMovement and a Transaction (expense).
 */
export class AddStock {
  constructor(
    private stockService: StockService,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    materialId: string;
    quantity: number;
    description: string;
    date?: Date;
  }): Promise<void> {
    await this.stockService.addStock({
      materialId: params.materialId,
      quantity: params.quantity,
      description: params.description,
      date: params.date,
    });
  }
}

import { EventBus } from '@shared/types';
import { Material } from '../entities/material.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { StockMovementType } from '../entities/inventory.enums';
import { IMaterialRepository } from '../repositories/material.repository';
import { IStockMovementRepository } from '../repositories/stock-movement.repository';
import { InsufficientStockError } from '@shared/errors/domain.errors';

/**
 * StockService - Domain Service
 * Manages stock operations, ensuring all stock changes go through movements.
 *
 * RULE: Stock is NEVER updated manually. Always through a StockMovement.
 */
export class StockService {
  constructor(
    private materialRepo: IMaterialRepository,
    private movementRepo: IStockMovementRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Add stock via a new IN movement.
   */
  async addStock(params: {
    materialId: string;
    quantity: number;
    description: string;
    relatedProjectId?: string;
    date?: Date;
  }): Promise<{ movement: StockMovement; material: Material }> {
    const material = await this.materialRepo.findById(params.materialId);
    if (!material) {
      throw new Error(`Material not found: ${params.materialId}`);
    }

    // Create the movement
    const movement = StockMovement.create({
      materialId: params.materialId,
      type: StockMovementType.IN,
      quantity: params.quantity,
      description: params.description,
      relatedProjectId: params.relatedProjectId,
      date: params.date,
    });

    // Adjust stock on material (aggregate internal behavior)
    material.increaseStock(params.quantity);

    // Persist both
    await this.movementRepo.save(movement);
    await this.materialRepo.save(material);

    // Publish events
    await this.eventBus.publishAll(movement.domainEvents);
    await this.eventBus.publishAll(material.domainEvents);

    movement.clearEvents();
    material.clearEvents();

    return { movement, material };
  }

  /**
   * Remove stock via a new OUT movement.
   * Throws InsufficientStockError if not enough stock.
   */
  async removeStock(params: {
    materialId: string;
    quantity: number;
    description: string;
    relatedProjectId?: string;
    date?: Date;
  }): Promise<{ movement: StockMovement; material: Material }> {
    const material = await this.materialRepo.findById(params.materialId);
    if (!material) {
      throw new Error(`Material not found: ${params.materialId}`);
    }

    if (params.quantity > material.currentStock) {
      throw new InsufficientStockError(material.name, params.quantity, material.currentStock);
    }

    // Create the movement
    const movement = StockMovement.create({
      materialId: params.materialId,
      type: StockMovementType.OUT,
      quantity: params.quantity,
      description: params.description,
      relatedProjectId: params.relatedProjectId,
      date: params.date,
    });

    // Adjust stock on material
    material.decreaseStock(params.quantity);

    // Persist both
    await this.movementRepo.save(movement);
    await this.materialRepo.save(material);

    // Publish events
    await this.eventBus.publishAll(movement.domainEvents);
    await this.eventBus.publishAll(material.domainEvents);

    movement.clearEvents();
    material.clearEvents();

    return { movement, material };
  }

  /**
   * Get stock level for a material.
   */
  async getStockLevel(materialId: string): Promise<number> {
    const material = await this.materialRepo.findById(materialId);
    if (!material) {
      throw new Error(`Material not found: ${materialId}`);
    }
    return material.currentStock;
  }

  /**
   * Get all materials with low stock.
   */
  async getLowStockMaterials(): Promise<Material[]> {
    return this.materialRepo.findLowStock();
  }

  /**
   * Get stock history for a material.
   */
  async getStockHistory(materialId: string): Promise<StockMovement[]> {
    return this.movementRepo.findByMaterial(materialId);
  }
}

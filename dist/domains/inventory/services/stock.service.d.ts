import { EventBus } from '../../../shared/types';
import { Material } from '../entities/material.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { IMaterialRepository } from '../repositories/material.repository';
import { IStockMovementRepository } from '../repositories/stock-movement.repository';
/**
 * StockService - Domain Service
 * Manages stock operations, ensuring all stock changes go through movements.
 *
 * RULE: Stock is NEVER updated manually. Always through a StockMovement.
 */
export declare class StockService {
    private materialRepo;
    private movementRepo;
    private eventBus;
    constructor(materialRepo: IMaterialRepository, movementRepo: IStockMovementRepository, eventBus: EventBus);
    /**
     * Add stock via a new IN movement.
     */
    addStock(params: {
        materialId: string;
        quantity: number;
        description: string;
        relatedProjectId?: string;
        date?: Date;
    }): Promise<{
        movement: StockMovement;
        material: Material;
    }>;
    /**
     * Remove stock via a new OUT movement.
     * Throws InsufficientStockError if not enough stock.
     */
    removeStock(params: {
        materialId: string;
        quantity: number;
        description: string;
        relatedProjectId?: string;
        date?: Date;
    }): Promise<{
        movement: StockMovement;
        material: Material;
    }>;
    /**
     * Get stock level for a material.
     */
    getStockLevel(materialId: string): Promise<number>;
    /**
     * Get all materials with low stock.
     */
    getLowStockMaterials(): Promise<Material[]>;
    /**
     * Get stock history for a material.
     */
    getStockHistory(materialId: string): Promise<StockMovement[]>;
}
//# sourceMappingURL=stock.service.d.ts.map
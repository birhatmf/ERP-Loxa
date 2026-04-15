import { EventBus } from '@shared/types';
import { Material, StockService, Unit } from '@domains/inventory';
import { IMaterialRepository } from '@domains/inventory';
/**
 * CreateMaterial Use Case
 * Creates a new material in the inventory catalog.
 */
export declare class CreateMaterial {
    private materialRepo;
    private eventBus;
    constructor(materialRepo: IMaterialRepository, eventBus: EventBus);
    execute(params: {
        name: string;
        unit: Unit;
        minStockLevel: number;
    }): Promise<Material>;
}
/**
 * AddStock Use Case
 * Handles purchasing material (stock IN).
 * Creates both a StockMovement and a Transaction (expense).
 */
export declare class AddStock {
    private stockService;
    private eventBus;
    constructor(stockService: StockService, eventBus: EventBus);
    execute(params: {
        materialId: string;
        quantity: number;
        description: string;
        date?: Date;
    }): Promise<void>;
}
//# sourceMappingURL=inventory.use-cases.d.ts.map
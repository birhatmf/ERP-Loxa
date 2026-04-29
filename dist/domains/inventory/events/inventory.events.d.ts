import { DomainEvent } from '../../../shared/types';
import { StockMovementType } from '../entities/inventory.enums';
/**
 * Fired when a stock movement is created.
 */
export declare class StockMovementCreatedEvent extends DomainEvent {
    readonly materialId: string;
    readonly movementType: StockMovementType;
    readonly quantity: number;
    constructor(movementId: string, materialId: string, movementType: StockMovementType, quantity: number);
}
/**
 * Fired when stock is adjusted (increase or decrease).
 */
export declare class StockAdjustedEvent extends DomainEvent {
    readonly materialName: string;
    readonly adjustmentType: 'IN' | 'OUT';
    readonly quantity: number;
    readonly newStockLevel: number;
    constructor(materialId: string, materialName: string, adjustmentType: 'IN' | 'OUT', quantity: number, newStockLevel: number);
}
/**
 * Fired when stock drops to or below minimum level.
 */
export declare class LowStockWarningEvent extends DomainEvent {
    readonly materialName: string;
    readonly currentStock: number;
    readonly minStockLevel: number;
    constructor(materialId: string, materialName: string, currentStock: number, minStockLevel: number);
}
//# sourceMappingURL=inventory.events.d.ts.map
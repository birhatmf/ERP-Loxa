import { AggregateRoot } from '../../../shared/types';
import { Unit } from './inventory.enums';
interface MaterialProps {
    id: string;
    name: string;
    unit: Unit;
    currentStock: number;
    minStockLevel: number;
    manualPrice?: number | null;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Material Aggregate Root.
 * Represents a material type in inventory.
 *
 * RULE: Stock can ONLY be changed through StockMovements, never manually.
 */
export declare class Material extends AggregateRoot {
    private _name;
    private _unit;
    private _currentStock;
    private _minStockLevel;
    private _manualPrice;
    private constructor();
    static create(params: {
        name: string;
        unit: Unit;
        minStockLevel: number;
    }): Material;
    static reconstitute(props: MaterialProps): Material;
    get name(): string;
    get unit(): Unit;
    get currentStock(): number;
    get minStockLevel(): number;
    get manualPrice(): number | null;
    get isLowStock(): boolean;
    /**
     * Increase stock. Called internally by domain service.
     */
    increaseStock(quantity: number): void;
    /**
     * Decrease stock. Called internally by domain service.
     */
    decreaseStock(quantity: number): void;
    /**
     * Update material info (name, unit, min stock level).
     */
    updateInfo(params: {
        name?: string;
        unit?: Unit;
        minStockLevel?: number;
        manualPrice?: number | null;
    }): void;
    /**
     * Set manual purchase price override.
     */
    setManualPrice(price: number | null): void;
    /**
     * Rebuild current stock from stock movement history.
     */
    rebuildStock(newStock: number): void;
}
export {};
//# sourceMappingURL=material.entity.d.ts.map
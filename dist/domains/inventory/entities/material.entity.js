"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Material = void 0;
const types_1 = require("../../../shared/types");
const inventory_events_1 = require("../events/inventory.events");
/**
 * Material Aggregate Root.
 * Represents a material type in inventory.
 *
 * RULE: Stock can ONLY be changed through StockMovements, never manually.
 */
class Material extends types_1.AggregateRoot {
    _name;
    _unit;
    _currentStock;
    _minStockLevel;
    _manualPrice;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._name = props.name;
        this._unit = props.unit;
        this._currentStock = props.currentStock;
        this._minStockLevel = props.minStockLevel;
        this._manualPrice = props.manualPrice ?? null;
    }
    static create(params) {
        if (!params.name || params.name.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Material name cannot be empty');
        }
        if (params.minStockLevel < 0) {
            throw new types_1.BusinessRuleViolationError('Minimum stock level cannot be negative');
        }
        const now = new Date();
        return new Material({
            id: (0, types_1.generateId)(),
            name: params.name.trim(),
            unit: params.unit,
            currentStock: 0,
            minStockLevel: params.minStockLevel,
            manualPrice: null,
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new Material(props);
    }
    // --- Getters ---
    get name() { return this._name; }
    get unit() { return this._unit; }
    get currentStock() { return this._currentStock; }
    get minStockLevel() { return this._minStockLevel; }
    get manualPrice() { return this._manualPrice; }
    get isLowStock() { return this._currentStock <= this._minStockLevel; }
    // --- Domain behavior (called by StockService, not directly) ---
    /**
     * Increase stock. Called internally by domain service.
     */
    increaseStock(quantity) {
        if (quantity <= 0) {
            throw new types_1.BusinessRuleViolationError('Stock increase quantity must be positive');
        }
        this._currentStock += quantity;
        this.touch();
        this.addDomainEvent(new inventory_events_1.StockAdjustedEvent(this.id, this._name, 'IN', quantity, this._currentStock));
    }
    /**
     * Decrease stock. Called internally by domain service.
     */
    decreaseStock(quantity) {
        if (quantity <= 0) {
            throw new types_1.BusinessRuleViolationError('Stock decrease quantity must be positive');
        }
        if (quantity > this._currentStock) {
            throw new types_1.BusinessRuleViolationError(`Insufficient stock for '${this._name}': requested ${quantity}, available ${this._currentStock}`);
        }
        this._currentStock -= quantity;
        this.touch();
        this.addDomainEvent(new inventory_events_1.StockAdjustedEvent(this.id, this._name, 'OUT', quantity, this._currentStock));
        // Check if stock is now low
        if (this.isLowStock) {
            this.addDomainEvent(new inventory_events_1.LowStockWarningEvent(this.id, this._name, this._currentStock, this._minStockLevel));
        }
    }
    /**
     * Update material info (name, unit, min stock level).
     */
    updateInfo(params) {
        if (params.name !== undefined) {
            if (!params.name || params.name.trim().length === 0) {
                throw new types_1.BusinessRuleViolationError('Material name cannot be empty');
            }
            this._name = params.name.trim();
        }
        if (params.unit !== undefined) {
            this._unit = params.unit;
        }
        if (params.minStockLevel !== undefined) {
            if (params.minStockLevel < 0) {
                throw new types_1.BusinessRuleViolationError('Minimum stock level cannot be negative');
            }
            this._minStockLevel = params.minStockLevel;
        }
        if (params.manualPrice !== undefined) {
            this.setManualPrice(params.manualPrice);
        }
        this.touch();
    }
    /**
     * Set manual purchase price override.
     */
    setManualPrice(price) {
        if (price !== null && price !== undefined && price < 0) {
            throw new types_1.BusinessRuleViolationError('Manual price cannot be negative');
        }
        this._manualPrice = price ?? null;
        this.touch();
    }
    /**
     * Rebuild current stock from stock movement history.
     */
    rebuildStock(newStock) {
        if (newStock < 0) {
            throw new types_1.BusinessRuleViolationError('Stock cannot be negative');
        }
        this._currentStock = newStock;
        this.touch();
    }
}
exports.Material = Material;
//# sourceMappingURL=material.entity.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowStockWarningEvent = exports.StockAdjustedEvent = exports.StockMovementCreatedEvent = void 0;
const types_1 = require("@shared/types");
/**
 * Fired when a stock movement is created.
 */
class StockMovementCreatedEvent extends types_1.DomainEvent {
    materialId;
    movementType;
    quantity;
    constructor(movementId, materialId, movementType, quantity) {
        super(movementId, 'StockMovementCreated');
        this.materialId = materialId;
        this.movementType = movementType;
        this.quantity = quantity;
    }
}
exports.StockMovementCreatedEvent = StockMovementCreatedEvent;
/**
 * Fired when stock is adjusted (increase or decrease).
 */
class StockAdjustedEvent extends types_1.DomainEvent {
    materialName;
    adjustmentType;
    quantity;
    newStockLevel;
    constructor(materialId, materialName, adjustmentType, quantity, newStockLevel) {
        super(materialId, 'StockAdjusted');
        this.materialName = materialName;
        this.adjustmentType = adjustmentType;
        this.quantity = quantity;
        this.newStockLevel = newStockLevel;
    }
}
exports.StockAdjustedEvent = StockAdjustedEvent;
/**
 * Fired when stock drops to or below minimum level.
 */
class LowStockWarningEvent extends types_1.DomainEvent {
    materialName;
    currentStock;
    minStockLevel;
    constructor(materialId, materialName, currentStock, minStockLevel) {
        super(materialId, 'LowStockWarning');
        this.materialName = materialName;
        this.currentStock = currentStock;
        this.minStockLevel = minStockLevel;
    }
}
exports.LowStockWarningEvent = LowStockWarningEvent;
//# sourceMappingURL=inventory.events.js.map
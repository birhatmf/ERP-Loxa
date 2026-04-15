"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockMovement = void 0;
const types_1 = require("@shared/types");
const inventory_enums_1 = require("./inventory.enums");
const inventory_events_1 = require("../events/inventory.events");
/**
 * StockMovement Aggregate Root.
 * Represents a stock change event.
 *
 * RULE: This is the ONLY way stock can change.
 */
class StockMovement extends types_1.AggregateRoot {
    _materialId;
    _type;
    _quantity;
    _description;
    _relatedProjectId;
    _date;
    _isCorrection;
    _correctionReason;
    _correctedAt;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._materialId = props.materialId;
        this._type = props.type;
        this._quantity = props.quantity;
        this._description = props.description;
        this._relatedProjectId = props.relatedProjectId;
        this._date = props.date;
        this._isCorrection = props.isCorrection ?? false;
        this._correctionReason = props.correctionReason ?? null;
        this._correctedAt = props.correctedAt ?? null;
    }
    static create(params) {
        if (params.quantity <= 0) {
            throw new types_1.BusinessRuleViolationError('Stock movement quantity must be positive');
        }
        if (!params.materialId) {
            throw new types_1.BusinessRuleViolationError('Material ID is required');
        }
        const now = new Date();
        const movement = new StockMovement({
            id: (0, types_1.generateId)(),
            ...params,
            date: params.date ?? now,
            isCorrection: false,
            correctionReason: null,
            correctedAt: null,
            createdAt: now,
            updatedAt: now,
        });
        movement.addDomainEvent(new inventory_events_1.StockMovementCreatedEvent(movement.id, params.materialId, params.type, params.quantity));
        return movement;
    }
    static reconstitute(props) {
        return new StockMovement(props);
    }
    // --- Getters ---
    get materialId() { return this._materialId; }
    get type() { return this._type; }
    get quantity() { return this._quantity; }
    get description() { return this._description; }
    get relatedProjectId() { return this._relatedProjectId; }
    get date() { return this._date; }
    get isCorrection() { return this._isCorrection; }
    get correctionReason() { return this._correctionReason; }
    get correctedAt() { return this._correctedAt; }
    get isIn() { return this._type === inventory_enums_1.StockMovementType.IN; }
    get isOut() { return this._type === inventory_enums_1.StockMovementType.OUT; }
    markAsCorrection(reason) {
        this._isCorrection = true;
        this._correctionReason = reason;
        this._correctedAt = new Date();
        this.touch();
    }
    updateDetails(params) {
        if (params.materialId !== undefined) {
            if (!params.materialId.trim()) {
                throw new types_1.BusinessRuleViolationError('Material ID is required');
            }
            this._materialId = params.materialId;
        }
        if (params.type !== undefined) {
            this._type = params.type;
        }
        if (params.quantity !== undefined) {
            if (params.quantity <= 0) {
                throw new types_1.BusinessRuleViolationError('Stock movement quantity must be positive');
            }
            this._quantity = params.quantity;
        }
        if (params.description !== undefined) {
            this._description = params.description;
        }
        if (params.date !== undefined) {
            this._date = params.date;
        }
        this.touch();
    }
}
exports.StockMovement = StockMovement;
//# sourceMappingURL=stock-movement.entity.js.map
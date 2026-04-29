"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectItem = void 0;
const types_1 = require("../../../shared/types");
/**
 * ProjectItem Entity.
 * Represents a material used in a project.
 * Items are part of the Project aggregate - they cannot exist without a project.
 */
class ProjectItem extends types_1.Entity {
    _projectId;
    _materialId;
    _quantity;
    _unitPrice;
    _totalPrice;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._projectId = props.projectId;
        this._materialId = props.materialId;
        this._quantity = props.quantity;
        this._unitPrice = props.unitPrice;
        this._totalPrice = props.totalPrice;
    }
    static create(params) {
        if (params.quantity <= 0) {
            throw new types_1.BusinessRuleViolationError('Project item quantity must be positive');
        }
        if (!params.materialId) {
            throw new types_1.BusinessRuleViolationError('Material ID is required');
        }
        const totalPrice = params.unitPrice.multiply(params.quantity);
        const now = new Date();
        return new ProjectItem({
            id: (0, types_1.generateId)(),
            projectId: params.projectId,
            materialId: params.materialId,
            quantity: params.quantity,
            unitPrice: params.unitPrice,
            totalPrice,
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new ProjectItem(props);
    }
    // --- Getters ---
    get projectId() { return this._projectId; }
    get materialId() { return this._materialId; }
    get quantity() { return this._quantity; }
    get unitPrice() { return this._unitPrice; }
    get totalPrice() { return this._totalPrice; }
    /**
     * Recalculate total price (e.g. if unit price changes).
     */
    recalculateTotal() {
        this._totalPrice = this._unitPrice.multiply(this._quantity);
        this.updatedAt = new Date();
    }
    /**
     * Update quantity.
     */
    updateQuantity(newQuantity) {
        if (newQuantity <= 0) {
            throw new types_1.BusinessRuleViolationError('Project item quantity must be positive');
        }
        this._quantity = newQuantity;
        this.recalculateTotal();
    }
    /**
     * Update unit price.
     */
    updateUnitPrice(newPrice) {
        this._unitPrice = newPrice;
        this.recalculateTotal();
    }
}
exports.ProjectItem = ProjectItem;
//# sourceMappingURL=project-item.entity.js.map
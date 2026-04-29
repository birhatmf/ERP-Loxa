"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceItem = void 0;
const types_1 = require("../../../shared/types");
/**
 * InvoiceItem Entity.
 * A line item on an invoice.
 */
class InvoiceItem extends types_1.Entity {
    _invoiceId;
    _description;
    _quantity;
    _unitPrice;
    _vatRate;
    _totalPrice;
    _vatAmount;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._invoiceId = props.invoiceId;
        this._description = props.description;
        this._quantity = props.quantity;
        this._unitPrice = props.unitPrice;
        this._vatRate = props.vatRate;
        this._totalPrice = props.totalPrice;
        this._vatAmount = props.vatAmount;
    }
    static create(params) {
        if (!params.description || params.description.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Invoice item description is required');
        }
        if (params.quantity <= 0) {
            throw new types_1.BusinessRuleViolationError('Invoice item quantity must be positive');
        }
        if (params.vatRate < 0 || params.vatRate > 100) {
            throw new types_1.BusinessRuleViolationError('VAT rate must be between 0 and 100');
        }
        const totalPrice = params.unitPrice.multiply(params.quantity);
        const vatAmount = totalPrice.multiply(params.vatRate / 100);
        const now = new Date();
        return new InvoiceItem({
            id: (0, types_1.generateId)(),
            invoiceId: params.invoiceId,
            description: params.description.trim(),
            quantity: params.quantity,
            unitPrice: params.unitPrice,
            vatRate: params.vatRate,
            totalPrice,
            vatAmount,
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new InvoiceItem(props);
    }
    // --- Getters ---
    get invoiceId() { return this._invoiceId; }
    get description() { return this._description; }
    get quantity() { return this._quantity; }
    get unitPrice() { return this._unitPrice; }
    get vatRate() { return this._vatRate; }
    get totalPrice() { return this._totalPrice; }
    get vatAmount() { return this._vatAmount; }
    get totalWithVat() { return this._totalPrice.add(this._vatAmount); }
}
exports.InvoiceItem = InvoiceItem;
//# sourceMappingURL=invoice-item.entity.js.map
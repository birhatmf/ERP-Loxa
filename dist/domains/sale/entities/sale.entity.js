"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sale = exports.SaleItem = void 0;
const types_1 = require("../../../shared/types");
class SaleItem {
    id;
    description;
    quantity;
    unitPrice;
    totalPrice;
    constructor(id, description, quantity, unitPrice, totalPrice) {
        this.id = id;
        this.description = description;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.totalPrice = totalPrice;
    }
    static reconstitute(props) {
        return new SaleItem(props.id, props.description, props.quantity, props.unitPrice, props.totalPrice);
    }
    static create(params) {
        const unitPrice = types_1.Money.create(params.unitPrice);
        const totalPrice = unitPrice.multiply(params.quantity);
        return new SaleItem((0, types_1.generateId)(), params.description, params.quantity, unitPrice, totalPrice);
    }
}
exports.SaleItem = SaleItem;
class Sale extends types_1.AggregateRoot {
    _customerName;
    _customerPhone;
    _customerAddress;
    _items;
    _totalAmount;
    _paymentStatus;
    _paymentMethod;
    _paymentNote;
    _description;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._customerName = props.customerName;
        this._customerPhone = props.customerPhone;
        this._customerAddress = props.customerAddress;
        this._items = props.items;
        this._totalAmount = props.totalAmount;
        this._paymentStatus = props.paymentStatus;
        this._paymentMethod = props.paymentMethod;
        this._paymentNote = props.paymentNote;
        this._description = props.description;
    }
    static create(params) {
        const now = new Date();
        const saleItems = params.items.map(item => SaleItem.create(item));
        const totalAmount = saleItems.reduce((sum, item) => sum.add(item.totalPrice), types_1.Money.create(0));
        return new Sale({
            id: (0, types_1.generateId)(),
            customerName: params.customerName,
            customerPhone: params.customerPhone ?? '',
            customerAddress: params.customerAddress ?? '',
            items: saleItems,
            totalAmount,
            paymentStatus: params.paymentStatus ?? 'bekliyor',
            paymentMethod: params.paymentMethod ?? 'nakit',
            paymentNote: params.paymentNote ?? '',
            description: params.description ?? '',
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new Sale(props);
    }
    get customerName() { return this._customerName; }
    get customerPhone() { return this._customerPhone; }
    get customerAddress() { return this._customerAddress; }
    get items() { return this._items; }
    get totalAmount() { return this._totalAmount; }
    get paymentStatus() { return this._paymentStatus; }
    get paymentMethod() { return this._paymentMethod; }
    get paymentNote() { return this._paymentNote; }
    get description() { return this._description; }
    updatePayment(params) {
        if (params.paymentStatus !== undefined)
            this._paymentStatus = params.paymentStatus;
        if (params.paymentMethod !== undefined)
            this._paymentMethod = params.paymentMethod;
        if (params.paymentNote !== undefined)
            this._paymentNote = params.paymentNote;
        this.touch();
    }
    updateInfo(params) {
        this.updatePayment({
            paymentStatus: params.paymentStatus,
            paymentMethod: params.paymentMethod,
            paymentNote: params.paymentNote,
        });
        if (params.description !== undefined) {
            this._description = params.description;
            this.touch();
        }
    }
    toSafeObject() {
        return {
            id: this.id,
            customerName: this._customerName,
            customerPhone: this._customerPhone,
            customerAddress: this._customerAddress,
            items: this._items.map(item => ({
                id: item.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice.amount,
                totalPrice: item.totalPrice.amount,
            })),
            totalAmount: this._totalAmount.amount,
            paymentStatus: this._paymentStatus,
            paymentMethod: this._paymentMethod,
            paymentNote: this._paymentNote,
            description: this._description,
            createdAt: this.createdAt,
        };
    }
}
exports.Sale = Sale;
//# sourceMappingURL=sale.entity.js.map
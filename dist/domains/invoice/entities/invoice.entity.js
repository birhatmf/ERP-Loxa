"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Invoice = void 0;
const types_1 = require("../../../shared/types");
const invoice_enums_1 = require("./invoice.enums");
const invoice_item_entity_1 = require("./invoice-item.entity");
const invoice_events_1 = require("../events/invoice.events");
let invoiceCounter = 0;
/**
 * Invoice Aggregate Root.
 * Represents a formal invoice document.
 *
 * RULE: Invoice lifecycle follows: draft → sent → paid/overdue/cancelled
 */
class Invoice extends types_1.AggregateRoot {
    _invoiceNumber;
    _projectId;
    _customerId;
    _customerName;
    _customerAddress;
    _items;
    _subtotal;
    _totalVat;
    _totalAmount;
    _dueDate;
    _status;
    _paidDate;
    _notes;
    _createdBy;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._invoiceNumber = props.invoiceNumber;
        this._projectId = props.projectId;
        this._customerId = props.customerId;
        this._customerName = props.customerName;
        this._customerAddress = props.customerAddress;
        this._items = props.items;
        this._subtotal = props.subtotal;
        this._totalVat = props.totalVat;
        this._totalAmount = props.totalAmount;
        this._dueDate = props.dueDate;
        this._status = props.status;
        this._paidDate = props.paidDate;
        this._notes = props.notes;
        this._createdBy = props.createdBy;
    }
    static create(params) {
        if (!params.customerName || params.customerName.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Customer name is required');
        }
        if (!params.items || params.items.length === 0) {
            throw new types_1.BusinessRuleViolationError('Invoice must have at least one item');
        }
        const now = new Date();
        const id = (0, types_1.generateId)();
        const invoiceNumber = Invoice.generateInvoiceNumber();
        // Create items
        const items = params.items.map(item => invoice_item_entity_1.InvoiceItem.create({
            invoiceId: id,
            ...item,
        }));
        // Calculate totals
        const currency = items[0].unitPrice.currency;
        const subtotal = items.reduce((sum, item) => sum.add(item.totalPrice), types_1.Money.zero(currency));
        const totalVat = items.reduce((sum, item) => sum.add(item.vatAmount), types_1.Money.zero(currency));
        const totalAmount = subtotal.add(totalVat);
        const invoice = new Invoice({
            id,
            invoiceNumber,
            projectId: params.projectId,
            customerId: params.customerId,
            customerName: params.customerName.trim(),
            customerAddress: params.customerAddress,
            items,
            subtotal,
            totalVat,
            totalAmount,
            dueDate: params.dueDate,
            status: invoice_enums_1.InvoiceStatus.DRAFT,
            notes: params.notes,
            createdBy: params.createdBy,
            createdAt: now,
            updatedAt: now,
        });
        invoice.addDomainEvent(new invoice_events_1.InvoiceCreatedEvent(invoice.id, invoice._invoiceNumber, invoice._totalAmount));
        return invoice;
    }
    static reconstitute(props) {
        return new Invoice(props);
    }
    // --- Getters ---
    get invoiceNumber() { return this._invoiceNumber; }
    get projectId() { return this._projectId; }
    get customerId() { return this._customerId; }
    get customerName() { return this._customerName; }
    get customerAddress() { return this._customerAddress; }
    get items() { return [...this._items]; }
    get subtotal() { return this._subtotal; }
    get totalVat() { return this._totalVat; }
    get totalAmount() { return this._totalAmount; }
    get dueDate() { return this._dueDate; }
    get status() { return this._status; }
    get paidDate() { return this._paidDate; }
    get notes() { return this._notes; }
    get createdBy() { return this._createdBy; }
    get isDraft() { return this._status === invoice_enums_1.InvoiceStatus.DRAFT; }
    get isPaid() { return this._status === invoice_enums_1.InvoiceStatus.PAID; }
    get isOverdue() {
        return this._status !== invoice_enums_1.InvoiceStatus.PAID &&
            this._status !== invoice_enums_1.InvoiceStatus.CANCELLED &&
            new Date() > this._dueDate;
    }
    // --- Domain behavior ---
    /**
     * Send the invoice to customer.
     */
    send() {
        if (this._status !== invoice_enums_1.InvoiceStatus.DRAFT) {
            throw new types_1.BusinessRuleViolationError(`Cannot send invoice: current status is ${this._status}`);
        }
        this._status = invoice_enums_1.InvoiceStatus.SENT;
        this.touch();
        this.addDomainEvent(new invoice_events_1.InvoiceSentEvent(this.id, this._invoiceNumber, this._customerName));
    }
    /**
     * Mark invoice as paid.
     */
    markAsPaid(paidDate) {
        if (this._status !== invoice_enums_1.InvoiceStatus.SENT && this._status !== invoice_enums_1.InvoiceStatus.OVERDUE) {
            throw new types_1.BusinessRuleViolationError(`Cannot mark invoice as paid: current status is ${this._status}`);
        }
        this._status = invoice_enums_1.InvoiceStatus.PAID;
        this._paidDate = paidDate ?? new Date();
        this.touch();
        this.addDomainEvent(new invoice_events_1.InvoicePaidEvent(this.id, this._invoiceNumber, this._totalAmount, this._paidDate));
    }
    /**
     * Mark invoice as overdue.
     */
    markAsOverdue() {
        if (this._status !== invoice_enums_1.InvoiceStatus.SENT) {
            throw new types_1.BusinessRuleViolationError(`Cannot mark invoice as overdue: current status is ${this._status}`);
        }
        this._status = invoice_enums_1.InvoiceStatus.OVERDUE;
        this.touch();
        this.addDomainEvent(new invoice_events_1.InvoiceOverdueEvent(this.id, this._invoiceNumber, this._totalAmount));
    }
    updateInfo(params) {
        if (params.customerName !== undefined) {
            const value = params.customerName.trim();
            if (!value) {
                throw new types_1.BusinessRuleViolationError('Customer name is required');
            }
            this._customerName = value;
        }
        if (params.customerAddress !== undefined) {
            this._customerAddress = params.customerAddress;
        }
        if (params.dueDate !== undefined) {
            this._dueDate = params.dueDate;
        }
        if (params.notes !== undefined) {
            this._notes = params.notes;
        }
        this.touch();
    }
    /**
     * Cancel the invoice.
     */
    cancel() {
        if (this._status === invoice_enums_1.InvoiceStatus.PAID) {
            throw new types_1.BusinessRuleViolationError('Cannot cancel a paid invoice');
        }
        this._status = invoice_enums_1.InvoiceStatus.CANCELLED;
        this.touch();
        this.addDomainEvent(new invoice_events_1.InvoiceCancelledEvent(this.id, this._invoiceNumber));
    }
    /**
     * Generate sequential invoice number.
     */
    static generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        invoiceCounter++;
        return `INV-${year}${month}-${String(invoiceCounter).padStart(4, '0')}`;
    }
}
exports.Invoice = Invoice;
//# sourceMappingURL=invoice.entity.js.map
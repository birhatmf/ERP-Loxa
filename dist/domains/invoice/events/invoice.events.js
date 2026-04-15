"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceCancelledEvent = exports.InvoiceOverdueEvent = exports.InvoicePaidEvent = exports.InvoiceSentEvent = exports.InvoiceCreatedEvent = void 0;
const types_1 = require("@shared/types");
/**
 * Fired when an invoice is created.
 */
class InvoiceCreatedEvent extends types_1.DomainEvent {
    invoiceNumber;
    totalAmount;
    constructor(invoiceId, invoiceNumber, totalAmount) {
        super(invoiceId, 'InvoiceCreated');
        this.invoiceNumber = invoiceNumber;
        this.totalAmount = totalAmount;
    }
}
exports.InvoiceCreatedEvent = InvoiceCreatedEvent;
/**
 * Fired when an invoice is sent to customer.
 */
class InvoiceSentEvent extends types_1.DomainEvent {
    invoiceNumber;
    customerName;
    constructor(invoiceId, invoiceNumber, customerName) {
        super(invoiceId, 'InvoiceSent');
        this.invoiceNumber = invoiceNumber;
        this.customerName = customerName;
    }
}
exports.InvoiceSentEvent = InvoiceSentEvent;
/**
 * Fired when an invoice is paid.
 * This should trigger creation of a Transaction.
 */
class InvoicePaidEvent extends types_1.DomainEvent {
    invoiceNumber;
    totalAmount;
    paidDate;
    constructor(invoiceId, invoiceNumber, totalAmount, paidDate) {
        super(invoiceId, 'InvoicePaid');
        this.invoiceNumber = invoiceNumber;
        this.totalAmount = totalAmount;
        this.paidDate = paidDate;
    }
}
exports.InvoicePaidEvent = InvoicePaidEvent;
/**
 * Fired when an invoice becomes overdue.
 */
class InvoiceOverdueEvent extends types_1.DomainEvent {
    invoiceNumber;
    totalAmount;
    constructor(invoiceId, invoiceNumber, totalAmount) {
        super(invoiceId, 'InvoiceOverdue');
        this.invoiceNumber = invoiceNumber;
        this.totalAmount = totalAmount;
    }
}
exports.InvoiceOverdueEvent = InvoiceOverdueEvent;
/**
 * Fired when an invoice is cancelled.
 */
class InvoiceCancelledEvent extends types_1.DomainEvent {
    invoiceNumber;
    constructor(invoiceId, invoiceNumber) {
        super(invoiceId, 'InvoiceCancelled');
        this.invoiceNumber = invoiceNumber;
    }
}
exports.InvoiceCancelledEvent = InvoiceCancelledEvent;
//# sourceMappingURL=invoice.events.js.map
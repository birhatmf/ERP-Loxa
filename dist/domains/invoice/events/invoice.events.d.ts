import { DomainEvent, Money } from '../../../shared/types';
/**
 * Fired when an invoice is created.
 */
export declare class InvoiceCreatedEvent extends DomainEvent {
    readonly invoiceNumber: string;
    readonly totalAmount: Money;
    constructor(invoiceId: string, invoiceNumber: string, totalAmount: Money);
}
/**
 * Fired when an invoice is sent to customer.
 */
export declare class InvoiceSentEvent extends DomainEvent {
    readonly invoiceNumber: string;
    readonly customerName: string;
    constructor(invoiceId: string, invoiceNumber: string, customerName: string);
}
/**
 * Fired when an invoice is paid.
 * This should trigger creation of a Transaction.
 */
export declare class InvoicePaidEvent extends DomainEvent {
    readonly invoiceNumber: string;
    readonly totalAmount: Money;
    readonly paidDate: Date;
    constructor(invoiceId: string, invoiceNumber: string, totalAmount: Money, paidDate: Date);
}
/**
 * Fired when an invoice becomes overdue.
 */
export declare class InvoiceOverdueEvent extends DomainEvent {
    readonly invoiceNumber: string;
    readonly totalAmount: Money;
    constructor(invoiceId: string, invoiceNumber: string, totalAmount: Money);
}
/**
 * Fired when an invoice is cancelled.
 */
export declare class InvoiceCancelledEvent extends DomainEvent {
    readonly invoiceNumber: string;
    constructor(invoiceId: string, invoiceNumber: string);
}
//# sourceMappingURL=invoice.events.d.ts.map
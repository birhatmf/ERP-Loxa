import { DomainEvent, Money } from '@shared/types';

/**
 * Fired when an invoice is created.
 */
export class InvoiceCreatedEvent extends DomainEvent {
  public readonly invoiceNumber: string;
  public readonly totalAmount: Money;

  constructor(invoiceId: string, invoiceNumber: string, totalAmount: Money) {
    super(invoiceId, 'InvoiceCreated');
    this.invoiceNumber = invoiceNumber;
    this.totalAmount = totalAmount;
  }
}

/**
 * Fired when an invoice is sent to customer.
 */
export class InvoiceSentEvent extends DomainEvent {
  public readonly invoiceNumber: string;
  public readonly customerName: string;

  constructor(invoiceId: string, invoiceNumber: string, customerName: string) {
    super(invoiceId, 'InvoiceSent');
    this.invoiceNumber = invoiceNumber;
    this.customerName = customerName;
  }
}

/**
 * Fired when an invoice is paid.
 * This should trigger creation of a Transaction.
 */
export class InvoicePaidEvent extends DomainEvent {
  public readonly invoiceNumber: string;
  public readonly totalAmount: Money;
  public readonly paidDate: Date;

  constructor(invoiceId: string, invoiceNumber: string, totalAmount: Money, paidDate: Date) {
    super(invoiceId, 'InvoicePaid');
    this.invoiceNumber = invoiceNumber;
    this.totalAmount = totalAmount;
    this.paidDate = paidDate;
  }
}

/**
 * Fired when an invoice becomes overdue.
 */
export class InvoiceOverdueEvent extends DomainEvent {
  public readonly invoiceNumber: string;
  public readonly totalAmount: Money;

  constructor(invoiceId: string, invoiceNumber: string, totalAmount: Money) {
    super(invoiceId, 'InvoiceOverdue');
    this.invoiceNumber = invoiceNumber;
    this.totalAmount = totalAmount;
  }
}

/**
 * Fired when an invoice is cancelled.
 */
export class InvoiceCancelledEvent extends DomainEvent {
  public readonly invoiceNumber: string;

  constructor(invoiceId: string, invoiceNumber: string) {
    super(invoiceId, 'InvoiceCancelled');
    this.invoiceNumber = invoiceNumber;
  }
}

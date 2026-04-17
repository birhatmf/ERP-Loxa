import { AggregateRoot, Money, generateId, BusinessRuleViolationError } from '@shared/types';
import { InvoiceStatus } from './invoice.enums';
import { InvoiceItem } from './invoice-item.entity';
import {
  InvoiceCreatedEvent,
  InvoiceSentEvent,
  InvoicePaidEvent,
  InvoiceOverdueEvent,
  InvoiceCancelledEvent,
} from '../events/invoice.events';

interface InvoiceProps {
  id: string;
  invoiceNumber: string;
  projectId?: string;
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: Money;
  totalVat: Money;
  totalAmount: Money;
  dueDate: Date;
  status: InvoiceStatus;
  paidDate?: Date;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

let invoiceCounter = 0;

/**
 * Invoice Aggregate Root.
 * Represents a formal invoice document.
 *
 * RULE: Invoice lifecycle follows: draft → sent → paid/overdue/cancelled
 */
export class Invoice extends AggregateRoot {
  private _invoiceNumber: string;
  private _projectId?: string;
  private _customerId?: string;
  private _customerName: string;
  private _customerAddress?: string;
  private _items: InvoiceItem[];
  private _subtotal: Money;
  private _totalVat: Money;
  private _totalAmount: Money;
  private _dueDate: Date;
  private _status: InvoiceStatus;
  private _paidDate?: Date;
  private _notes?: string;
  private _createdBy: string;

  private constructor(props: InvoiceProps) {
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

  static create(params: {
    projectId?: string;
    customerId?: string;
    customerName: string;
    customerAddress?: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: Money;
      vatRate: number;
    }>;
    dueDate: Date;
    notes?: string;
    createdBy: string;
  }): Invoice {
    if (!params.customerName || params.customerName.trim().length === 0) {
      throw new BusinessRuleViolationError('Customer name is required');
    }
    if (!params.items || params.items.length === 0) {
      throw new BusinessRuleViolationError('Invoice must have at least one item');
    }

    const now = new Date();
    const id = generateId();
    const invoiceNumber = Invoice.generateInvoiceNumber();

    // Create items
    const items = params.items.map(item =>
      InvoiceItem.create({
        invoiceId: id,
        ...item,
      })
    );

    // Calculate totals
    const currency = items[0].unitPrice.currency;
    const subtotal = items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      Money.zero(currency)
    );
    const totalVat = items.reduce(
      (sum, item) => sum.add(item.vatAmount),
      Money.zero(currency)
    );
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
      status: InvoiceStatus.DRAFT,
      notes: params.notes,
      createdBy: params.createdBy,
      createdAt: now,
      updatedAt: now,
    });

    invoice.addDomainEvent(
      new InvoiceCreatedEvent(invoice.id, invoice._invoiceNumber, invoice._totalAmount)
    );

    return invoice;
  }

  static reconstitute(props: InvoiceProps): Invoice {
    return new Invoice(props);
  }

  // --- Getters ---
  get invoiceNumber(): string { return this._invoiceNumber; }
  get projectId(): string | undefined { return this._projectId; }
  get customerId(): string | undefined { return this._customerId; }
  get customerName(): string { return this._customerName; }
  get customerAddress(): string | undefined { return this._customerAddress; }
  get items(): InvoiceItem[] { return [...this._items]; }
  get subtotal(): Money { return this._subtotal; }
  get totalVat(): Money { return this._totalVat; }
  get totalAmount(): Money { return this._totalAmount; }
  get dueDate(): Date { return this._dueDate; }
  get status(): InvoiceStatus { return this._status; }
  get paidDate(): Date | undefined { return this._paidDate; }
  get notes(): string | undefined { return this._notes; }
  get createdBy(): string { return this._createdBy; }

  get isDraft(): boolean { return this._status === InvoiceStatus.DRAFT; }
  get isPaid(): boolean { return this._status === InvoiceStatus.PAID; }
  get isOverdue(): boolean {
    return this._status !== InvoiceStatus.PAID &&
           this._status !== InvoiceStatus.CANCELLED &&
           new Date() > this._dueDate;
  }

  // --- Domain behavior ---

  /**
   * Send the invoice to customer.
   */
  send(): void {
    if (this._status !== InvoiceStatus.DRAFT) {
      throw new BusinessRuleViolationError(
        `Cannot send invoice: current status is ${this._status}`
      );
    }

    this._status = InvoiceStatus.SENT;
    this.touch();

    this.addDomainEvent(
      new InvoiceSentEvent(this.id, this._invoiceNumber, this._customerName)
    );
  }

  /**
   * Mark invoice as paid.
   */
  markAsPaid(paidDate?: Date): void {
    if (this._status !== InvoiceStatus.SENT && this._status !== InvoiceStatus.OVERDUE) {
      throw new BusinessRuleViolationError(
        `Cannot mark invoice as paid: current status is ${this._status}`
      );
    }

    this._status = InvoiceStatus.PAID;
    this._paidDate = paidDate ?? new Date();
    this.touch();

    this.addDomainEvent(
      new InvoicePaidEvent(this.id, this._invoiceNumber, this._totalAmount, this._paidDate)
    );
  }

  /**
   * Mark invoice as overdue.
   */
  markAsOverdue(): void {
    if (this._status !== InvoiceStatus.SENT) {
      throw new BusinessRuleViolationError(
        `Cannot mark invoice as overdue: current status is ${this._status}`
      );
    }

    this._status = InvoiceStatus.OVERDUE;
    this.touch();

    this.addDomainEvent(
      new InvoiceOverdueEvent(this.id, this._invoiceNumber, this._totalAmount)
    );
  }

  updateInfo(params: {
    customerName?: string;
    customerAddress?: string;
    dueDate?: Date;
    notes?: string;
  }): void {
    if (params.customerName !== undefined) {
      const value = params.customerName.trim();
      if (!value) {
        throw new BusinessRuleViolationError('Customer name is required');
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
  cancel(): void {
    if (this._status === InvoiceStatus.PAID) {
      throw new BusinessRuleViolationError('Cannot cancel a paid invoice');
    }

    this._status = InvoiceStatus.CANCELLED;
    this.touch();

    this.addDomainEvent(
      new InvoiceCancelledEvent(this.id, this._invoiceNumber)
    );
  }

  /**
   * Generate sequential invoice number.
   */
  private static generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    invoiceCounter++;
    return `INV-${year}${month}-${String(invoiceCounter).padStart(4, '0')}`;
  }
}

import { AggregateRoot, Money } from '../../../shared/types';
import { InvoiceStatus } from './invoice.enums';
import { InvoiceItem } from './invoice-item.entity';
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
/**
 * Invoice Aggregate Root.
 * Represents a formal invoice document.
 *
 * RULE: Invoice lifecycle follows: draft → sent → paid/overdue/cancelled
 */
export declare class Invoice extends AggregateRoot {
    private _invoiceNumber;
    private _projectId?;
    private _customerId?;
    private _customerName;
    private _customerAddress?;
    private _items;
    private _subtotal;
    private _totalVat;
    private _totalAmount;
    private _dueDate;
    private _status;
    private _paidDate?;
    private _notes?;
    private _createdBy;
    private constructor();
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
    }): Invoice;
    static reconstitute(props: InvoiceProps): Invoice;
    get invoiceNumber(): string;
    get projectId(): string | undefined;
    get customerId(): string | undefined;
    get customerName(): string;
    get customerAddress(): string | undefined;
    get items(): InvoiceItem[];
    get subtotal(): Money;
    get totalVat(): Money;
    get totalAmount(): Money;
    get dueDate(): Date;
    get status(): InvoiceStatus;
    get paidDate(): Date | undefined;
    get notes(): string | undefined;
    get createdBy(): string;
    get isDraft(): boolean;
    get isPaid(): boolean;
    get isOverdue(): boolean;
    /**
     * Send the invoice to customer.
     */
    send(): void;
    /**
     * Mark invoice as paid.
     */
    markAsPaid(paidDate?: Date): void;
    /**
     * Mark invoice as overdue.
     */
    markAsOverdue(): void;
    updateInfo(params: {
        customerName?: string;
        customerAddress?: string;
        dueDate?: Date;
        notes?: string;
    }): void;
    /**
     * Cancel the invoice.
     */
    cancel(): void;
    /**
     * Generate sequential invoice number.
     */
    private static generateInvoiceNumber;
}
export {};
//# sourceMappingURL=invoice.entity.d.ts.map
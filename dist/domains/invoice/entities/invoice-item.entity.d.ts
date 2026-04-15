import { Entity, Money } from '@shared/types';
interface InvoiceItemProps {
    id: string;
    invoiceId: string;
    description: string;
    quantity: number;
    unitPrice: Money;
    vatRate: number;
    totalPrice: Money;
    vatAmount: Money;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * InvoiceItem Entity.
 * A line item on an invoice.
 */
export declare class InvoiceItem extends Entity {
    private _invoiceId;
    private _description;
    private _quantity;
    private _unitPrice;
    private _vatRate;
    private _totalPrice;
    private _vatAmount;
    private constructor();
    static create(params: {
        invoiceId: string;
        description: string;
        quantity: number;
        unitPrice: Money;
        vatRate: number;
    }): InvoiceItem;
    static reconstitute(props: InvoiceItemProps): InvoiceItem;
    get invoiceId(): string;
    get description(): string;
    get quantity(): number;
    get unitPrice(): Money;
    get vatRate(): number;
    get totalPrice(): Money;
    get vatAmount(): Money;
    get totalWithVat(): Money;
}
export {};
//# sourceMappingURL=invoice-item.entity.d.ts.map
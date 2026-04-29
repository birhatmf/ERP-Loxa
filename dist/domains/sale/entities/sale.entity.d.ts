import { AggregateRoot, Money } from '../../../shared/types';
export type SaleStatus = 'bekliyor' | 'kısmi' | 'ödendi';
interface SaleItemProps {
    id: string;
    description: string;
    quantity: number;
    unitPrice: Money;
    totalPrice: Money;
}
export declare class SaleItem {
    readonly id: string;
    readonly description: string;
    readonly quantity: number;
    readonly unitPrice: Money;
    readonly totalPrice: Money;
    private constructor();
    static reconstitute(props: SaleItemProps): SaleItem;
    static create(params: {
        description: string;
        quantity: number;
        unitPrice: number;
    }): SaleItem;
}
interface SaleProps {
    id: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    items: SaleItem[];
    totalAmount: Money;
    paymentStatus: SaleStatus;
    paymentMethod: string;
    paymentNote: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Sale extends AggregateRoot {
    private _customerName;
    private _customerPhone;
    private _customerAddress;
    private _items;
    private _totalAmount;
    private _paymentStatus;
    private _paymentMethod;
    private _paymentNote;
    private _description;
    private constructor();
    static create(params: {
        customerName: string;
        customerPhone?: string;
        customerAddress?: string;
        items: Array<{
            description: string;
            quantity: number;
            unitPrice: number;
        }>;
        paymentMethod?: string;
        paymentStatus?: SaleStatus;
        paymentNote?: string;
        description?: string;
    }): Sale;
    static reconstitute(props: SaleProps): Sale;
    get customerName(): string;
    get customerPhone(): string;
    get customerAddress(): string;
    get items(): SaleItem[];
    get totalAmount(): Money;
    get paymentStatus(): SaleStatus;
    get paymentMethod(): string;
    get paymentNote(): string;
    get description(): string;
    updatePayment(params: {
        paymentStatus?: SaleStatus;
        paymentMethod?: string;
        paymentNote?: string;
    }): void;
    updateInfo(params: {
        paymentStatus?: SaleStatus;
        paymentMethod?: string;
        paymentNote?: string;
        description?: string;
    }): void;
    toSafeObject(): {
        id: string;
        customerName: string;
        customerPhone: string;
        customerAddress: string;
        items: {
            id: string;
            description: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
        }[];
        totalAmount: number;
        paymentStatus: SaleStatus;
        paymentMethod: string;
        paymentNote: string;
        description: string;
        createdAt: Date;
    };
}
export {};
//# sourceMappingURL=sale.entity.d.ts.map
import { AggregateRoot, Money } from '../../../shared/types';
interface CustomerProps {
    id: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
    notes: string;
    totalPurchases: Money;
    outstandingBalance: Money;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Customer extends AggregateRoot {
    private _name;
    private _phone;
    private _email;
    private _address;
    private _taxId;
    private _notes;
    private _totalPurchases;
    private _outstandingBalance;
    private constructor();
    static create(params: {
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        taxId?: string;
        notes?: string;
    }): Customer;
    static reconstitute(props: CustomerProps): Customer;
    get name(): string;
    get phone(): string;
    get email(): string;
    get address(): string;
    get taxId(): string;
    get notes(): string;
    get totalPurchases(): Money;
    get outstandingBalance(): Money;
    updateInfo(params: {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        taxId?: string;
        notes?: string;
    }): void;
    addPurchase(amount: Money): void;
    updateOutstandingBalance(amount: Money): void;
    toSafeObject(): {
        id: string;
        name: string;
        phone: string;
        email: string;
        address: string;
        taxId: string;
        notes: string;
        totalPurchases: number;
        outstandingBalance: number;
        createdAt: Date;
        updatedAt: Date;
    };
}
export {};
//# sourceMappingURL=customer.entity.d.ts.map
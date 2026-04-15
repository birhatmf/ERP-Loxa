import { AggregateRoot, Money } from '@shared/types';
import { TransactionType, PaymentMethod, TransactionStatus } from './transaction.enums';
interface TransactionProps {
    id: string;
    amount: Money;
    vatAmount: Money;
    type: TransactionType;
    paymentMethod: PaymentMethod;
    isInvoiced: boolean;
    description: string;
    createdBy: string;
    relatedProjectId?: string;
    status: TransactionStatus;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Transaction Aggregate Root.
 * Represents a financial movement in the system.
 *
 * RULE: Transactions can NEVER be deleted, only cancelled.
 */
export declare class Transaction extends AggregateRoot {
    private _amount;
    private _vatAmount;
    private _type;
    private _paymentMethod;
    private _isInvoiced;
    private _description;
    private _createdBy;
    private _relatedProjectId?;
    private _status;
    private _cancellationReason?;
    private constructor();
    static create(params: {
        amount: Money;
        vatAmount: Money;
        type: TransactionType;
        paymentMethod: PaymentMethod;
        isInvoiced: boolean;
        description: string;
        createdBy: string;
        relatedProjectId?: string;
    }): Transaction;
    static reconstitute(props: TransactionProps): Transaction;
    get amount(): Money;
    get vatAmount(): Money;
    get totalWithVat(): Money;
    get type(): TransactionType;
    get paymentMethod(): PaymentMethod;
    get isInvoiced(): boolean;
    get description(): string;
    get createdBy(): string;
    get relatedProjectId(): string | undefined;
    get status(): TransactionStatus;
    get cancellationReason(): string | undefined;
    get isActive(): boolean;
    /**
     * Cancel this transaction.
     * RULE: Active transactions can only be cancelled, never deleted.
     */
    cancel(reason: string): void;
    /**
     * Mark this transaction as invoiced.
     */
    markAsInvoiced(): void;
    /**
     * Link this transaction to a project.
     */
    linkToProject(projectId: string): void;
}
export {};
//# sourceMappingURL=transaction.entity.d.ts.map
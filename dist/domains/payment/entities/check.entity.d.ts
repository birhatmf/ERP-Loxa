import { AggregateRoot, Money } from '../../../shared/types';
import { CheckType, CheckStatus } from './payment.enums';
interface CheckProps {
    id: string;
    type: CheckType;
    amount: Money;
    dueDate: Date;
    ownerName: string;
    checkNumber?: string;
    bankName?: string;
    description: string;
    status: CheckStatus;
    paidDate?: Date;
    relatedProjectId?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Check Aggregate Root.
 * Represents a check or deferred payment.
 *
 * RULE: When due date arrives, payment is expected.
 * When paid, a Transaction is created via domain event.
 */
export declare class Check extends AggregateRoot {
    private _type;
    private _amount;
    private _dueDate;
    private _ownerName;
    private _checkNumber?;
    private _bankName?;
    private _description;
    private _status;
    private _paidDate?;
    private _relatedProjectId?;
    private constructor();
    static create(params: {
        type: CheckType;
        amount: Money;
        dueDate: Date;
        ownerName: string;
        checkNumber?: string;
        bankName?: string;
        description?: string;
        relatedProjectId?: string;
    }): Check;
    static reconstitute(props: CheckProps): Check;
    get type(): CheckType;
    get amount(): Money;
    get dueDate(): Date;
    get ownerName(): string;
    get checkNumber(): string | undefined;
    get bankName(): string | undefined;
    get description(): string;
    get status(): CheckStatus;
    get paidDate(): Date | undefined;
    get relatedProjectId(): string | undefined;
    get isPending(): boolean;
    get isPaid(): boolean;
    get isOverdue(): boolean;
    /**
     * Mark check as paid.
     * This should trigger creation of a Transaction.
     */
    markAsPaid(paidDate?: Date): void;
    /**
     * Mark check as bounced (karşılıksız).
     */
    markAsBounced(): void;
    /**
     * Cancel the check.
     */
    cancel(): void;
}
export {};
//# sourceMappingURL=check.entity.d.ts.map
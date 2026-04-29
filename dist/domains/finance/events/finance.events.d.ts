import { DomainEvent, Money } from '../../../shared/types';
import { TransactionType } from '../entities/transaction.enums';
/**
 * Fired when a new transaction is created.
 */
export declare class TransactionCreatedEvent extends DomainEvent {
    readonly transactionType: TransactionType;
    readonly amount: Money;
    constructor(transactionId: string, transactionType: TransactionType, amount: Money);
}
/**
 * Fired when a transaction is cancelled.
 */
export declare class TransactionCancelledEvent extends DomainEvent {
    readonly reason: string;
    constructor(transactionId: string, reason: string);
}
/**
 * Fired when cash balance changes.
 */
export declare class CashBalanceChangedEvent extends DomainEvent {
    readonly newBalance: Money;
    readonly changeAmount: Money;
    readonly isIncome: boolean;
    constructor(aggregateId: string, newBalance: Money, changeAmount: Money, isIncome: boolean);
}
//# sourceMappingURL=finance.events.d.ts.map
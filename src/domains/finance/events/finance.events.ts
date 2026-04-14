import { DomainEvent, Money } from '@shared/types';
import { TransactionType } from '../entities/transaction.enums';

/**
 * Fired when a new transaction is created.
 */
export class TransactionCreatedEvent extends DomainEvent {
  public readonly transactionType: TransactionType;
  public readonly amount: Money;

  constructor(transactionId: string, transactionType: TransactionType, amount: Money) {
    super(transactionId, 'TransactionCreated');
    this.transactionType = transactionType;
    this.amount = amount;
  }
}

/**
 * Fired when a transaction is cancelled.
 */
export class TransactionCancelledEvent extends DomainEvent {
  public readonly reason: string;

  constructor(transactionId: string, reason: string) {
    super(transactionId, 'TransactionCancelled');
    this.reason = reason;
  }
}

/**
 * Fired when cash balance changes.
 */
export class CashBalanceChangedEvent extends DomainEvent {
  public readonly newBalance: Money;
  public readonly changeAmount: Money;
  public readonly isIncome: boolean;

  constructor(aggregateId: string, newBalance: Money, changeAmount: Money, isIncome: boolean) {
    super(aggregateId, 'CashBalanceChanged');
    this.newBalance = newBalance;
    this.changeAmount = changeAmount;
    this.isIncome = isIncome;
  }
}

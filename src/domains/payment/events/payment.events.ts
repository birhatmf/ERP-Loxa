import { DomainEvent, Money } from '@shared/types';
import { CheckType } from '../entities/payment.enums';

/**
 * Fired when a new check is created.
 */
export class CheckCreatedEvent extends DomainEvent {
  public readonly checkType: CheckType;
  public readonly amount: Money;
  public readonly dueDate: Date;

  constructor(checkId: string, checkType: CheckType, amount: Money, dueDate: Date) {
    super(checkId, 'CheckCreated');
    this.checkType = checkType;
    this.amount = amount;
    this.dueDate = dueDate;
  }
}

/**
 * Fired when a check is paid.
 * This triggers creation of a corresponding Transaction.
 */
export class CheckPaidEvent extends DomainEvent {
  public readonly checkType: CheckType;
  public readonly amount: Money;
  public readonly paidDate: Date;

  constructor(checkId: string, checkType: CheckType, amount: Money, paidDate: Date) {
    super(checkId, 'CheckPaid');
    this.checkType = checkType;
    this.amount = amount;
    this.paidDate = paidDate;
  }
}

/**
 * Fired when a check bounces (karşılıksız).
 */
export class CheckBouncedEvent extends DomainEvent {
  public readonly amount: Money;
  public readonly ownerName: string;

  constructor(checkId: string, amount: Money, ownerName: string) {
    super(checkId, 'CheckBounced');
    this.amount = amount;
    this.ownerName = ownerName;
  }
}

/**
 * Fired when a check is cancelled.
 */
export class CheckCancelledEvent extends DomainEvent {
  constructor(checkId: string) {
    super(checkId, 'CheckCancelled');
  }
}

/**
 * Fired when a check becomes overdue.
 */
export class CheckOverdueEvent extends DomainEvent {
  public readonly amount: Money;
  public readonly ownerName: string;
  public readonly dueDate: Date;
  public readonly daysOverdue: number;

  constructor(
    checkId: string,
    amount: Money,
    ownerName: string,
    dueDate: Date,
    daysOverdue: number
  ) {
    super(checkId, 'CheckOverdue');
    this.amount = amount;
    this.ownerName = ownerName;
    this.dueDate = dueDate;
    this.daysOverdue = daysOverdue;
  }
}

import { AggregateRoot, Money, generateId, BusinessRuleViolationError } from '@shared/types';
import { TransactionType } from './transaction.enums';
import { RecurringFrequency } from './recurring-transaction.enums';

interface RecurringTransactionProps {
  id: string;
  description: string;
  amount: Money;
  type: TransactionType;
  category: string;
  paymentMethod: string;
  frequency: RecurringFrequency;
  dayOfMonth: number;
  isActive: boolean;
  nextRun: Date;
  lastRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface RecurringTransactionUpdateProps {
  description?: string;
  amount?: number;
  type?: TransactionType;
  category?: string;
  paymentMethod?: string;
  frequency?: RecurringFrequency;
  dayOfMonth?: number;
  isActive?: boolean;
}

export class RecurringTransaction extends AggregateRoot {
  private _description: string;
  private _amount: Money;
  private _type: TransactionType;
  private _category: string;
  private _paymentMethod: string;
  private _frequency: RecurringFrequency;
  private _dayOfMonth: number;
  private _isActive: boolean;
  private _nextRun: Date;
  private _lastRun?: Date;

  private constructor(props: RecurringTransactionProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._description = props.description;
    this._amount = props.amount;
    this._type = props.type;
    this._category = props.category;
    this._paymentMethod = props.paymentMethod;
    this._frequency = props.frequency;
    this._dayOfMonth = props.dayOfMonth;
    this._isActive = props.isActive;
    this._nextRun = props.nextRun;
    this._lastRun = props.lastRun;
  }

  static create(params: {
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    paymentMethod: string;
    frequency: RecurringFrequency;
    dayOfMonth: number;
    createdAt?: Date;
  }): RecurringTransaction {
    if (!params.description || params.description.trim().length === 0) {
      throw new BusinessRuleViolationError('Recurring description is required');
    }
    if (!params.category || params.category.trim().length === 0) {
      throw new BusinessRuleViolationError('Recurring category is required');
    }
    if (params.amount <= 0) {
      throw new BusinessRuleViolationError('Recurring amount must be positive');
    }
    if (params.dayOfMonth < 1 || params.dayOfMonth > 28) {
      throw new BusinessRuleViolationError('dayOfMonth must be between 1 and 28');
    }

    const now = params.createdAt ?? new Date();
    const nextRun = RecurringTransaction.calculateNextRun(now, params.frequency, params.dayOfMonth);

    return new RecurringTransaction({
      id: generateId(),
      description: params.description.trim(),
      amount: Money.create(params.amount),
      type: params.type,
      category: params.category.trim(),
      paymentMethod: params.paymentMethod,
      frequency: params.frequency,
      dayOfMonth: params.dayOfMonth,
      isActive: true,
      nextRun,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: RecurringTransactionProps): RecurringTransaction {
    return new RecurringTransaction(props);
  }

  get description(): string { return this._description; }
  get amount(): Money { return this._amount; }
  get type(): TransactionType { return this._type; }
  get category(): string { return this._category; }
  get paymentMethod(): string { return this._paymentMethod; }
  get frequency(): RecurringFrequency { return this._frequency; }
  get dayOfMonth(): number { return this._dayOfMonth; }
  get isActive(): boolean { return this._isActive; }
  get nextRun(): Date { return this._nextRun; }
  get lastRun(): Date | undefined { return this._lastRun; }

  setActive(isActive: boolean): void {
    this._isActive = isActive;
    this.touch();
  }

  updateInfo(params: RecurringTransactionUpdateProps): void {
    if (params.description !== undefined) {
      if (!params.description.trim()) {
        throw new BusinessRuleViolationError('Recurring description is required');
      }
      this._description = params.description.trim();
    }

    if (params.amount !== undefined) {
      if (params.amount <= 0) {
        throw new BusinessRuleViolationError('Recurring amount must be positive');
      }
      this._amount = Money.create(params.amount);
    }

    if (params.type !== undefined) {
      this._type = params.type;
    }

    if (params.category !== undefined) {
      if (!params.category.trim()) {
        throw new BusinessRuleViolationError('Recurring category is required');
      }
      this._category = params.category.trim();
    }

    if (params.paymentMethod !== undefined) {
      this._paymentMethod = params.paymentMethod;
    }

    if (params.frequency !== undefined) {
      this._frequency = params.frequency;
    }

    if (params.dayOfMonth !== undefined) {
      if (params.dayOfMonth < 1 || params.dayOfMonth > 28) {
        throw new BusinessRuleViolationError('dayOfMonth must be between 1 and 28');
      }
      this._dayOfMonth = params.dayOfMonth;
    }

    if (
      params.frequency !== undefined ||
      params.dayOfMonth !== undefined
    ) {
      this._nextRun = RecurringTransaction.calculateNextRun(new Date(), this._frequency, this._dayOfMonth);
    }

    if (params.isActive !== undefined) {
      this._isActive = params.isActive;
    }

    this.touch();
  }

  markRun(runDate: Date = new Date()): void {
    this._lastRun = runDate;
    this._nextRun = RecurringTransaction.calculateNextRun(runDate, this._frequency, this._dayOfMonth);
    this.touch();
  }

  private static calculateNextRun(baseDate: Date, frequency: RecurringFrequency, dayOfMonth: number): Date {
    const next = new Date(baseDate);

    switch (frequency) {
      case RecurringFrequency.DAILY:
        next.setDate(next.getDate() + 1);
        break;
      case RecurringFrequency.WEEKLY:
        next.setDate(next.getDate() + 7);
        break;
      case RecurringFrequency.MONTHLY:
        next.setMonth(next.getMonth() + 1);
        next.setDate(dayOfMonth);
        break;
      case RecurringFrequency.QUARTERLY:
        next.setMonth(next.getMonth() + 3);
        next.setDate(dayOfMonth);
        break;
      case RecurringFrequency.YEARLY:
        next.setFullYear(next.getFullYear() + 1);
        next.setDate(dayOfMonth);
        break;
      default:
        next.setMonth(next.getMonth() + 1);
        next.setDate(dayOfMonth);
    }

    return next;
  }
}

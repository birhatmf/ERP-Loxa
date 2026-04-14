import { AggregateRoot, Money, generateId, BusinessRuleViolationError } from '@shared/types';
import { CheckType, CheckStatus } from './payment.enums';
import {
  CheckCreatedEvent,
  CheckPaidEvent,
  CheckBouncedEvent,
  CheckCancelledEvent,
} from '../events/payment.events';

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
export class Check extends AggregateRoot {
  private _type: CheckType;
  private _amount: Money;
  private _dueDate: Date;
  private _ownerName: string;
  private _checkNumber?: string;
  private _bankName?: string;
  private _description: string;
  private _status: CheckStatus;
  private _paidDate?: Date;
  private _relatedProjectId?: string;

  private constructor(props: CheckProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._type = props.type;
    this._amount = props.amount;
    this._dueDate = props.dueDate;
    this._ownerName = props.ownerName;
    this._checkNumber = props.checkNumber;
    this._bankName = props.bankName;
    this._description = props.description;
    this._status = props.status;
    this._paidDate = props.paidDate;
    this._relatedProjectId = props.relatedProjectId;
  }

  static create(params: {
    type: CheckType;
    amount: Money;
    dueDate: Date;
    ownerName: string;
    checkNumber?: string;
    bankName?: string;
    description?: string;
    relatedProjectId?: string;
  }): Check {
    if (params.amount.isZero() || params.amount.isNegative()) {
      throw new BusinessRuleViolationError('Check amount must be positive');
    }
    if (!params.ownerName || params.ownerName.trim().length === 0) {
      throw new BusinessRuleViolationError('Owner name is required');
    }
    if (params.dueDate < new Date()) {
      // Warning: creating a check with a past due date
      // This might be intentional (backdated entry), so just allow it
    }

    const now = new Date();
    const check = new Check({
      id: generateId(),
      ...params,
      description: params.description ?? '',
      status: CheckStatus.PENDING,
      createdAt: now,
      updatedAt: now,
    });

    check.addDomainEvent(
      new CheckCreatedEvent(check.id, params.type, params.amount, params.dueDate)
    );

    return check;
  }

  static reconstitute(props: CheckProps): Check {
    return new Check(props);
  }

  // --- Getters ---
  get type(): CheckType { return this._type; }
  get amount(): Money { return this._amount; }
  get dueDate(): Date { return this._dueDate; }
  get ownerName(): string { return this._ownerName; }
  get checkNumber(): string | undefined { return this._checkNumber; }
  get bankName(): string | undefined { return this._bankName; }
  get description(): string { return this._description; }
  get status(): CheckStatus { return this._status; }
  get paidDate(): Date | undefined { return this._paidDate; }
  get relatedProjectId(): string | undefined { return this._relatedProjectId; }

  get isPending(): boolean { return this._status === CheckStatus.PENDING; }
  get isPaid(): boolean { return this._status === CheckStatus.PAID; }
  get isOverdue(): boolean {
    return this._status === CheckStatus.PENDING && new Date() > this._dueDate;
  }

  // --- Domain behavior ---

  /**
   * Mark check as paid.
   * This should trigger creation of a Transaction.
   */
  markAsPaid(paidDate?: Date): void {
    if (this._status !== CheckStatus.PENDING) {
      throw new BusinessRuleViolationError(
        `Cannot mark check as paid: current status is ${this._status}`
      );
    }

    this._status = CheckStatus.PAID;
    this._paidDate = paidDate ?? new Date();
    this.touch();

    this.addDomainEvent(
      new CheckPaidEvent(this.id, this._type, this._amount, this._paidDate)
    );
  }

  /**
   * Mark check as bounced (karşılıksız).
   */
  markAsBounced(): void {
    if (this._status !== CheckStatus.PENDING) {
      throw new BusinessRuleViolationError(
        `Cannot mark check as bounced: current status is ${this._status}`
      );
    }

    this._status = CheckStatus.BOUNCED;
    this.touch();

    this.addDomainEvent(
      new CheckBouncedEvent(this.id, this._amount, this._ownerName)
    );
  }

  /**
   * Cancel the check.
   */
  cancel(): void {
    if (this._status !== CheckStatus.PENDING) {
      throw new BusinessRuleViolationError(
        `Cannot cancel check: current status is ${this._status}`
      );
    }

    this._status = CheckStatus.CANCELLED;
    this.touch();

    this.addDomainEvent(
      new CheckCancelledEvent(this.id)
    );
  }
}

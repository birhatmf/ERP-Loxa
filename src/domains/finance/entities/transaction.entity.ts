import { AggregateRoot, Money, generateId, BusinessRuleViolationError } from '@shared/types';
import { TransactionType, PaymentMethod, TransactionStatus } from './transaction.enums';
import { TransactionCreatedEvent, TransactionCancelledEvent } from '../events/finance.events';

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
export class Transaction extends AggregateRoot {
  private _amount: Money;
  private _vatAmount: Money;
  private _type: TransactionType;
  private _paymentMethod: PaymentMethod;
  private _isInvoiced: boolean;
  private _description: string;
  private _createdBy: string;
  private _relatedProjectId?: string;
  private _status: TransactionStatus;
  private _cancellationReason?: string;

  private constructor(props: TransactionProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._amount = props.amount;
    this._vatAmount = props.vatAmount;
    this._type = props.type;
    this._paymentMethod = props.paymentMethod;
    this._isInvoiced = props.isInvoiced;
    this._description = props.description;
    this._createdBy = props.createdBy;
    this._relatedProjectId = props.relatedProjectId;
    this._status = props.status;
    this._cancellationReason = props.cancellationReason;
  }

  // --- Factory method for creating new transactions ---
  static create(params: {
    amount: Money;
    vatAmount: Money;
    type: TransactionType;
    paymentMethod: PaymentMethod;
    isInvoiced: boolean;
    description: string;
    createdBy: string;
    relatedProjectId?: string;
  }): Transaction {
    if (params.amount.isZero() || params.amount.isNegative()) {
      throw new BusinessRuleViolationError('Transaction amount must be positive');
    }

    const now = new Date();
    const transaction = new Transaction({
      id: generateId(),
      ...params,
      status: TransactionStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    transaction.addDomainEvent(
      new TransactionCreatedEvent(transaction.id, params.type, params.amount)
    );

    return transaction;
  }

  // --- Factory method for reconstituting from persistence ---
  static reconstitute(props: TransactionProps): Transaction {
    return new Transaction(props);
  }

  // --- Getters ---
  get amount(): Money { return this._amount; }
  get vatAmount(): Money { return this._vatAmount; }
  get totalWithVat(): Money { return this._amount.add(this._vatAmount); }
  get type(): TransactionType { return this._type; }
  get paymentMethod(): PaymentMethod { return this._paymentMethod; }
  get isInvoiced(): boolean { return this._isInvoiced; }
  get description(): string { return this._description; }
  get createdBy(): string { return this._createdBy; }
  get relatedProjectId(): string | undefined { return this._relatedProjectId; }
  get status(): TransactionStatus { return this._status; }
  get cancellationReason(): string | undefined { return this._cancellationReason; }
  get isActive(): boolean { return this._status === TransactionStatus.ACTIVE; }

  // --- Domain behavior ---

  /**
   * Cancel this transaction.
   * RULE: Active transactions can only be cancelled, never deleted.
   */
  cancel(reason: string): void {
    if (this._status === TransactionStatus.CANCELLED) {
      throw new BusinessRuleViolationError('Transaction is already cancelled');
    }

    this._status = TransactionStatus.CANCELLED;
    this._cancellationReason = reason;
    this.touch();

    this.addDomainEvent(
      new TransactionCancelledEvent(this.id, reason)
    );
  }

  /**
   * Mark this transaction as invoiced.
   */
  markAsInvoiced(): void {
    if (this._isInvoiced) {
      throw new BusinessRuleViolationError('Transaction is already invoiced');
    }
    this._isInvoiced = true;
    this.touch();
  }

  /**
   * Link this transaction to a project.
   */
  linkToProject(projectId: string): void {
    if (this._relatedProjectId) {
      throw new BusinessRuleViolationError('Transaction is already linked to a project');
    }
    this._relatedProjectId = projectId;
    this.touch();
  }
}

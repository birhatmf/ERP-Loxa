import { Money, EventBus } from '@shared/types';
import { Check, CheckType, CheckPaidEvent } from '@domains/payment';
import { ICheckRepository } from '@domains/payment';
import { Transaction, TransactionType, PaymentMethod } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';

/**
 * CreateCheck Use Case
 * Creates a new check/deferred payment.
 */
export class CreateCheck {
  constructor(
    private checkRepo: ICheckRepository,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    type: CheckType;
    amount: number;
    dueDate: Date;
    ownerName: string;
    checkNumber?: string;
    bankName?: string;
    description?: string;
    relatedProjectId?: string;
    currency?: string;
  }): Promise<Check> {
    const check = Check.create({
      type: params.type,
      amount: Money.create(params.amount, params.currency),
      dueDate: params.dueDate,
      ownerName: params.ownerName,
      checkNumber: params.checkNumber,
      bankName: params.bankName,
      description: params.description,
      relatedProjectId: params.relatedProjectId,
    });

    await this.checkRepo.save(check);
    await this.eventBus.publishAll(check.domainEvents);
    check.clearEvents();

    return check;
  }
}

/**
 * PayCheck Use Case
 * Marks a check as paid and creates the corresponding Transaction.
 *
 * This is a cross-domain use case:
 * Payment domain → creates event → Finance domain creates Transaction
 */
export class PayCheck {
  constructor(
    private checkRepo: ICheckRepository,
    private transactionRepo: ITransactionRepository,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    checkId: string;
    paidDate?: Date;
    createdBy: string;
  }): Promise<{ check: Check; transaction: Transaction }> {
    const check = await this.checkRepo.findById(params.checkId);
    if (!check) {
      throw new Error(`Check not found: ${params.checkId}`);
    }

    // 1. Mark check as paid (triggers CheckPaidEvent)
    check.markAsPaid(params.paidDate);

    // 2. Create corresponding transaction
    const transactionType = check.type === CheckType.RECEIVED
      ? TransactionType.INCOME
      : TransactionType.EXPENSE;

    const transaction = Transaction.create({
      amount: check.amount,
      vatAmount: Money.zero(check.amount.currency),
      type: transactionType,
      paymentMethod: PaymentMethod.TRANSFER,
      isInvoiced: false,
      description: `Check payment: ${check.ownerName} - ${check.description}`,
      createdBy: params.createdBy,
      relatedProjectId: check.relatedProjectId,
    });

    // 3. Persist both
    await this.checkRepo.save(check);
    await this.transactionRepo.save(transaction);

    // 4. Publish events
    await this.eventBus.publishAll(check.domainEvents);
    await this.eventBus.publishAll(transaction.domainEvents);

    check.clearEvents();
    transaction.clearEvents();

    return { check, transaction };
  }
}

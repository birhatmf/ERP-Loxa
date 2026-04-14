import { Money, EventBus } from '@shared/types';
import { Transaction, TransactionType, PaymentMethod } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';

/**
 * CreateTransaction Use Case
 * Handles the creation of a new financial transaction.
 */
export class CreateTransaction {
  constructor(
    private transactionRepo: ITransactionRepository,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    amount: number;
    vatAmount: number;
    type: TransactionType;
    paymentMethod: PaymentMethod;
    isInvoiced: boolean;
    description: string;
    createdBy: string;
    relatedProjectId?: string;
    currency?: string;
  }): Promise<Transaction> {
    const transaction = Transaction.create({
      amount: Money.create(params.amount, params.currency),
      vatAmount: Money.create(params.vatAmount, params.currency),
      type: params.type,
      paymentMethod: params.paymentMethod,
      isInvoiced: params.isInvoiced,
      description: params.description,
      createdBy: params.createdBy,
      relatedProjectId: params.relatedProjectId,
    });

    await this.transactionRepo.save(transaction);
    await this.eventBus.publishAll(transaction.domainEvents);
    transaction.clearEvents();

    return transaction;
  }
}

import { EventBus } from '@shared/types';
import { Transaction, TransactionType, PaymentMethod } from '@domains/finance';
import { ITransactionRepository } from '@domains/finance';
/**
 * CreateTransaction Use Case
 * Handles the creation of a new financial transaction.
 */
export declare class CreateTransaction {
    private transactionRepo;
    private eventBus;
    constructor(transactionRepo: ITransactionRepository, eventBus: EventBus);
    execute(params: {
        amount: number;
        vatAmount: number;
        type: TransactionType;
        paymentMethod: PaymentMethod;
        isInvoiced: boolean;
        description: string;
        createdBy: string;
        relatedProjectId?: string;
        currency?: string;
    }): Promise<Transaction>;
}
//# sourceMappingURL=create-transaction.use-case.d.ts.map
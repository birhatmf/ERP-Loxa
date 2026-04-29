import { EventBus } from '../../../shared/types';
import { Check, CheckType } from '../../../domains/payment';
import { ICheckRepository } from '../../../domains/payment';
import { Transaction } from '../../../domains/finance';
import { ITransactionRepository } from '../../../domains/finance';
/**
 * CreateCheck Use Case
 * Creates a new check/deferred payment.
 */
export declare class CreateCheck {
    private checkRepo;
    private eventBus;
    constructor(checkRepo: ICheckRepository, eventBus: EventBus);
    execute(params: {
        type: CheckType;
        amount: number;
        dueDate: Date;
        ownerName: string;
        checkNumber?: string;
        bankName?: string;
        description?: string;
        relatedProjectId?: string;
        currency?: string;
    }): Promise<Check>;
}
/**
 * PayCheck Use Case
 * Marks a check as paid and creates the corresponding Transaction.
 *
 * This is a cross-domain use case:
 * Payment domain → creates event → Finance domain creates Transaction
 */
export declare class PayCheck {
    private checkRepo;
    private transactionRepo;
    private eventBus;
    constructor(checkRepo: ICheckRepository, transactionRepo: ITransactionRepository, eventBus: EventBus);
    execute(params: {
        checkId: string;
        paidDate?: Date;
        createdBy: string;
    }): Promise<{
        check: Check;
        transaction: Transaction;
    }>;
}
//# sourceMappingURL=payment.use-cases.d.ts.map
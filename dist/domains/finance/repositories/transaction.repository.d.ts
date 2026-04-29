import { IRepository } from '../../../shared/types/repository.interface';
import { Transaction } from '../entities/transaction.entity';
import { TransactionType, TransactionStatus, PaymentMethod } from '../entities/transaction.enums';
/**
 * Repository interface for Transaction aggregate.
 */
export interface ITransactionRepository extends IRepository<Transaction> {
    findByStatus(status: TransactionStatus): Promise<Transaction[]>;
    findByType(type: TransactionType): Promise<Transaction[]>;
    findByProject(projectId: string): Promise<Transaction[]>;
    findByDateRange(from: Date, to: Date): Promise<Transaction[]>;
    findByPaymentMethod(method: PaymentMethod): Promise<Transaction[]>;
    findActive(): Promise<Transaction[]>;
}
//# sourceMappingURL=transaction.repository.d.ts.map
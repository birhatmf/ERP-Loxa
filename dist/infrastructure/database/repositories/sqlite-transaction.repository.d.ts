import { Knex } from 'knex';
import { Transaction, TransactionType, PaymentMethod, TransactionStatus } from '../../../domains/finance';
import { ITransactionRepository } from '../../../domains/finance';
/**
 * SQLite implementation of Transaction repository.
 */
export declare class SqliteTransactionRepository implements ITransactionRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Transaction | null>;
    findAll(): Promise<Transaction[]>;
    save(entity: Transaction): Promise<void>;
    delete(id: string): Promise<void>;
    findByStatus(status: TransactionStatus): Promise<Transaction[]>;
    findByType(type: TransactionType): Promise<Transaction[]>;
    findByProject(projectId: string): Promise<Transaction[]>;
    findByDateRange(from: Date, to: Date): Promise<Transaction[]>;
    findByPaymentMethod(method: PaymentMethod): Promise<Transaction[]>;
    findActive(): Promise<Transaction[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-transaction.repository.d.ts.map
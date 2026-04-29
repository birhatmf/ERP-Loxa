import { Knex } from 'knex';
import { RecurringTransaction } from '../../../domains/finance/entities/recurring-transaction.entity';
import { IRecurringTransactionRepository } from '../../../domains/finance/repositories/recurring-transaction.repository';
export declare class SqliteRecurringTransactionRepository implements IRecurringTransactionRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<RecurringTransaction | null>;
    findAll(): Promise<RecurringTransaction[]>;
    save(entity: RecurringTransaction): Promise<void>;
    delete(id: string): Promise<void>;
    findActive(): Promise<RecurringTransaction[]>;
    findDue(now?: Date): Promise<RecurringTransaction[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-recurring-transaction.repository.d.ts.map
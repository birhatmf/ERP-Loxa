import { IRepository } from '@shared/types/repository.interface';
import { RecurringTransaction } from '../entities/recurring-transaction.entity';

export interface IRecurringTransactionRepository extends IRepository<RecurringTransaction> {
  findActive(): Promise<RecurringTransaction[]>;
  findDue(now?: Date): Promise<RecurringTransaction[]>;
}


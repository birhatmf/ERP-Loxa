import { BudgetItem } from '../entities/budget-item.entity';

export interface IBudgetRepository {
  findById(id: string): Promise<BudgetItem | null>;
  findAll(): Promise<BudgetItem[]>;
  findByPeriod(period: string): Promise<BudgetItem[]>;
  save(entity: BudgetItem): Promise<void>;
  delete(id: string): Promise<void>;
}

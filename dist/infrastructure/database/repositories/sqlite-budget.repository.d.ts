import { Knex } from 'knex';
import { BudgetItem } from '../../../domains/budget/entities/budget-item.entity';
import { IBudgetRepository } from '../../../domains/budget/repositories/budget.repository';
export declare class SqliteBudgetRepository implements IBudgetRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<BudgetItem | null>;
    findAll(): Promise<BudgetItem[]>;
    findByPeriod(period: string): Promise<BudgetItem[]>;
    save(entity: BudgetItem): Promise<void>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-budget.repository.d.ts.map
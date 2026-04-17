import { Knex } from 'knex';
import { BudgetItem, BudgetType } from '@domains/budget/entities/budget-item.entity';
import { IBudgetRepository } from '@domains/budget/repositories/budget.repository';
import { Money } from '@shared/types';

export class SqliteBudgetRepository implements IBudgetRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<BudgetItem | null> {
    const row = await this.knex('budget_items').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<BudgetItem[]> {
    const rows = await this.knex('budget_items').orderBy('period', 'desc').orderBy('created_at', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async findByPeriod(period: string): Promise<BudgetItem[]> {
    const rows = await this.knex('budget_items').where({ period }).orderBy('created_at', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async save(entity: BudgetItem): Promise<void> {
    const existing = await this.knex('budget_items').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);
    if (existing) {
      await this.knex('budget_items').where({ id: entity.id }).update(row);
    } else {
      await this.knex('budget_items').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('budget_items').where({ id }).delete();
  }

  private toDomain(row: any): BudgetItem {
    return BudgetItem.reconstitute({
      id: row.id,
      category: row.category,
      type: row.type as BudgetType,
      planned: Money.create(row.planned),
      period: row.period,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: BudgetItem): Record<string, any> {
    return {
      id: entity.id,
      category: entity.category,
      type: entity.type,
      planned: entity.planned.amountDecimal,
      period: entity.period,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}

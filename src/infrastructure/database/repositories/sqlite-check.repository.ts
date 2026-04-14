import { Knex } from 'knex';
import { Check, CheckType, CheckStatus } from '@domains/payment';
import { ICheckRepository } from '@domains/payment';
import { Money } from '@shared/types';

/**
 * SQLite implementation of Check repository.
 */
export class SqliteCheckRepository implements ICheckRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Check | null> {
    const row = await this.knex('checks').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Check[]> {
    const rows = await this.knex('checks').orderBy('due_date', 'asc');
    return rows.map((r: any) => this.toDomain(r));
  }

  async save(entity: Check): Promise<void> {
    const existing = await this.knex('checks').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('checks').where({ id: entity.id }).update(row);
    } else {
      await this.knex('checks').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('checks').where({ id }).delete();
  }

  async findByStatus(status: CheckStatus): Promise<Check[]> {
    const rows = await this.knex('checks').where({ status });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByType(type: CheckType): Promise<Check[]> {
    const rows = await this.knex('checks').where({ type });
    return rows.map((r: any) => this.toDomain(r));
  }

  async findPending(): Promise<Check[]> {
    return this.findByStatus(CheckStatus.PENDING);
  }

  async findOverdue(): Promise<Check[]> {
    const now = new Date().toISOString();
    const rows = await this.knex('checks')
      .where({ status: CheckStatus.PENDING })
      .where('due_date', '<', now)
      .orderBy('due_date', 'asc');
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByDueDateRange(from: Date, to: Date): Promise<Check[]> {
    const rows = await this.knex('checks')
      .whereBetween('due_date', [from.toISOString(), to.toISOString()])
      .orderBy('due_date', 'asc');
    return rows.map((r: any) => this.toDomain(r));
  }

  async findByProject(projectId: string): Promise<Check[]> {
    const rows = await this.knex('checks').where({ related_project_id: projectId });
    return rows.map((r: any) => this.toDomain(r));
  }

  private toDomain(row: any): Check {
    return Check.reconstitute({
      id: row.id,
      type: row.type as CheckType,
      amount: Money.create(row.amount, row.amount_currency),
      dueDate: new Date(row.due_date),
      ownerName: row.owner_name,
      checkNumber: row.check_number,
      bankName: row.bank_name,
      description: row.description,
      status: row.status as CheckStatus,
      paidDate: row.paid_date ? new Date(row.paid_date) : undefined,
      relatedProjectId: row.related_project_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: Check): Record<string, any> {
    return {
      id: entity.id,
      type: entity.type,
      amount: entity.amount.amountDecimal,
      amount_currency: entity.amount.currency,
      due_date: entity.dueDate.toISOString(),
      owner_name: entity.ownerName,
      check_number: entity.checkNumber ?? null,
      bank_name: entity.bankName ?? null,
      description: entity.description,
      status: entity.status,
      paid_date: entity.paidDate?.toISOString() ?? null,
      related_project_id: entity.relatedProjectId ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}

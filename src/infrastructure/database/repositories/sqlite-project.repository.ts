import { Knex } from 'knex';
import { Project, ProjectStatus, ProjectItem } from '@domains/project';
import { IProjectRepository } from '@domains/project';
import { Money } from '@shared/types';

/**
 * SQLite implementation of Project repository.
 */
export class SqliteProjectRepository implements IProjectRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Project | null> {
    const row = await this.knex('projects').where({ id }).first();
    if (!row) return null;

    const items = await this.knex('project_items').where({ project_id: id });
    return this.toDomain(row, items);
  }

  async findAll(): Promise<Project[]> {
    const rows = await this.knex('projects').orderBy('created_at', 'desc');
    const projects: Project[] = [];

    for (const row of rows) {
      const items = await this.knex('project_items').where({ project_id: row.id });
      projects.push(this.toDomain(row, items));
    }

    return projects;
  }

  async save(entity: Project): Promise<void> {
    const existing = await this.knex('projects').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('projects').where({ id: entity.id }).update(row);
    } else {
      await this.knex('projects').insert(row);
    }

    // Sync items
    await this.knex('project_items').where({ project_id: entity.id }).delete();
    for (const item of entity.items) {
      await this.knex('project_items').insert(this.toItemPersistence(item));
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('project_items').where({ project_id: id }).delete();
    await this.knex('projects').where({ id }).delete();
  }

  async findByCustomer(customerName: string): Promise<Project[]> {
    const rows = await this.knex('projects').where({ customer_name: customerName });
    const projects: Project[] = [];

    for (const row of rows) {
      const items = await this.knex('project_items').where({ project_id: row.id });
      projects.push(this.toDomain(row, items));
    }

    return projects;
  }

  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    const rows = await this.knex('projects').where({ status });
    const projects: Project[] = [];

    for (const row of rows) {
      const items = await this.knex('project_items').where({ project_id: row.id });
      projects.push(this.toDomain(row, items));
    }

    return projects;
  }

  async findActive(): Promise<Project[]> {
    return this.findByStatus(ProjectStatus.ACTIVE);
  }

  private toDomain(row: any, itemRows: any[]): Project {
    const items = itemRows.map(ir => ProjectItem.reconstitute({
      id: ir.id,
      projectId: ir.project_id,
      materialId: ir.material_id,
      quantity: parseFloat(ir.quantity),
      unitPrice: Money.create(ir.unit_price, ir.unit_price_currency),
      totalPrice: Money.create(ir.total_price, ir.total_price_currency),
      createdAt: new Date(ir.created_at),
      updatedAt: new Date(ir.updated_at),
    }));

    return Project.reconstitute({
      id: row.id,
      name: row.name,
      customerName: row.customer_name,
      description: row.description,
      startDate: new Date(row.start_date),
      endDate: row.end_date ? new Date(row.end_date) : undefined,
      status: row.status as ProjectStatus,
      totalPrice: Money.create(row.total_price, row.total_price_currency),
      items,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: Project): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      customer_name: entity.customerName,
      description: entity.description,
      start_date: entity.startDate.toISOString(),
      end_date: entity.endDate?.toISOString() ?? null,
      status: entity.status,
      total_price: entity.totalPrice.amountDecimal,
      total_price_currency: entity.totalPrice.currency,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }

  private toItemPersistence(item: ProjectItem): Record<string, any> {
    return {
      id: item.id,
      project_id: item.projectId,
      material_id: item.materialId,
      quantity: item.quantity,
      unit_price: item.unitPrice.amountDecimal,
      unit_price_currency: item.unitPrice.currency,
      total_price: item.totalPrice.amountDecimal,
      total_price_currency: item.totalPrice.currency,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    };
  }
}

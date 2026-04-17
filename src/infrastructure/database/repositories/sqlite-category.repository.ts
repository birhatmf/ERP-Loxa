import { Knex } from 'knex';
import { Category, CategoryType } from '@domains/category/entities/category.entity';
import { ICategoryRepository } from '@domains/category/repositories/category.repository';

export class SqliteCategoryRepository implements ICategoryRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Category | null> {
    const row = await this.knex('categories').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Category[]> {
    const rows = await this.knex('categories').orderBy('name', 'asc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async findByType(type: string): Promise<Category[]> {
    const rows = await this.knex('categories').where({ type }).orderBy('name', 'asc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async save(entity: Category): Promise<void> {
    const existing = await this.knex('categories').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);
    if (existing) {
      await this.knex('categories').where({ id: entity.id }).update(row);
    } else {
      await this.knex('categories').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('categories').where({ id }).delete();
  }

  private toDomain(row: any): Category {
    return Category.reconstitute({
      id: row.id,
      name: row.name,
      type: row.type as CategoryType,
      color: row.color ?? '#6366f1',
      icon: row.icon ?? '',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: Category): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      color: entity.color,
      icon: entity.icon,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}

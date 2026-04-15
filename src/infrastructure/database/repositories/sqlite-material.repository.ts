import { Knex } from 'knex';
import { Material, Unit } from '@domains/inventory';
import { IMaterialRepository } from '@domains/inventory';

/**
 * SQLite implementation of Material repository.
 */
export class SqliteMaterialRepository implements IMaterialRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<Material | null> {
    const row = await this.knex('materials').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Material[]> {
    const rows = await this.knex('materials').orderBy('name');
    return rows.map((r: any) => this.toDomain(r));
  }

  async save(entity: Material): Promise<void> {
    const existing = await this.knex('materials').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('materials').where({ id: entity.id }).update(row);
    } else {
      await this.knex('materials').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('materials').where({ id }).delete();
  }

  async findByName(name: string): Promise<Material | null> {
    const row = await this.knex('materials').where({ name }).first();
    return row ? this.toDomain(row) : null;
  }

  async findLowStock(): Promise<Material[]> {
    const rows = await this.knex('materials')
      .whereRaw('current_stock <= min_stock_level')
      .orderBy('name');
    return rows.map((r: any) => this.toDomain(r));
  }

  private toDomain(row: any): Material {
    return Material.reconstitute({
      id: row.id,
      name: row.name,
      unit: row.unit as Unit,
      currentStock: parseFloat(row.current_stock),
      minStockLevel: parseFloat(row.min_stock_level),
      manualPrice: row.manual_price !== null && row.manual_price !== undefined
        ? parseFloat(row.manual_price)
        : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: Material): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      unit: entity.unit,
      current_stock: entity.currentStock,
      min_stock_level: entity.minStockLevel,
      manual_price: entity.manualPrice ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}

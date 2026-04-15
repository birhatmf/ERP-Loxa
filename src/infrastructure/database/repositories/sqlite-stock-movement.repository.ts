import { Knex } from 'knex';
import { IStockMovementRepository, StockMovement, StockMovementType } from '@domains/inventory';

export class SqliteStockMovementRepository implements IStockMovementRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<StockMovement | null> {
    const row = await this.knex('stock_movements').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<StockMovement[]> {
    const rows = await this.knex('stock_movements').orderBy('date', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async save(entity: StockMovement): Promise<void> {
    const existing = await this.knex('stock_movements').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('stock_movements').where({ id: entity.id }).update(row);
    } else {
      await this.knex('stock_movements').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('stock_movements').where({ id }).delete();
  }

  async findByMaterial(materialId: string): Promise<StockMovement[]> {
    const rows = await this.knex('stock_movements').where({ material_id: materialId }).orderBy('date', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async findByProject(projectId: string): Promise<StockMovement[]> {
    const rows = await this.knex('stock_movements').where({ related_project_id: projectId }).orderBy('date', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async findByType(type: StockMovementType): Promise<StockMovement[]> {
    const rows = await this.knex('stock_movements').where({ type }).orderBy('date', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async findByDateRange(from: Date, to: Date): Promise<StockMovement[]> {
    const rows = await this.knex('stock_movements')
      .whereBetween('date', [from.toISOString(), to.toISOString()])
      .orderBy('date', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  private toDomain(row: any): StockMovement {
    return StockMovement.reconstitute({
      id: row.id,
      materialId: row.material_id,
      type: row.type as StockMovementType,
      quantity: parseFloat(row.quantity),
      description: row.description,
      relatedProjectId: row.related_project_id,
      date: new Date(row.date),
      isCorrection: Boolean(row.is_correction),
      correctionReason: row.correction_reason ?? null,
      correctedAt: row.corrected_at ? new Date(row.corrected_at) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  private toPersistence(entity: StockMovement): Record<string, any> {
    return {
      id: entity.id,
      material_id: entity.materialId,
      type: entity.type,
      quantity: entity.quantity,
      description: entity.description,
      related_project_id: entity.relatedProjectId ?? null,
      date: entity.date.toISOString(),
      is_correction: entity.isCorrection ? 1 : 0,
      correction_reason: entity.correctionReason ?? null,
      corrected_at: entity.correctedAt?.toISOString() ?? null,
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}

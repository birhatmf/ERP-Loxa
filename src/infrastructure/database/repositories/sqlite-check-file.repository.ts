import { Knex } from 'knex';
import { CheckFileRecord, ICheckFileRepository } from '@domains/payment';

export class SqliteCheckFileRepository implements ICheckFileRepository {
  constructor(private knex: Knex) {}

  async findById(id: string): Promise<CheckFileRecord | null> {
    const row = await this.knex('check_files').where({ id }).first();
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<CheckFileRecord[]> {
    const rows = await this.knex('check_files').orderBy('uploaded_at', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async save(entity: CheckFileRecord): Promise<void> {
    const existing = await this.knex('check_files').where({ id: entity.id }).first();
    const row = this.toPersistence(entity);

    if (existing) {
      await this.knex('check_files').where({ id: entity.id }).update(row);
    } else {
      await this.knex('check_files').insert(row);
    }
  }

  async delete(id: string): Promise<void> {
    await this.knex('check_files').where({ id }).delete();
  }

  async findByCheckId(checkId: string): Promise<CheckFileRecord[]> {
    const rows = await this.knex('check_files').where({ check_id: checkId }).orderBy('uploaded_at', 'desc');
    return rows.map((row: any) => this.toDomain(row));
  }

  async deleteByCheckId(checkId: string): Promise<void> {
    await this.knex('check_files').where({ check_id: checkId }).delete();
  }

  private toDomain(row: any): CheckFileRecord {
    return {
      id: row.id,
      checkId: row.check_id,
      name: row.name,
      originalName: row.original_name,
      mimeType: row.mime_type,
      size: Number(row.size),
      storagePath: row.storage_path,
      uploadedAt: new Date(row.uploaded_at),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toPersistence(entity: CheckFileRecord): Record<string, any> {
    return {
      id: entity.id,
      check_id: entity.checkId,
      name: entity.name,
      original_name: entity.originalName,
      mime_type: entity.mimeType,
      size: entity.size,
      storage_path: entity.storagePath,
      uploaded_at: entity.uploadedAt.toISOString(),
      created_at: entity.createdAt.toISOString(),
      updated_at: entity.updatedAt.toISOString(),
    };
  }
}

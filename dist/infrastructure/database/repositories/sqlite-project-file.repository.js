"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqliteProjectFileRepository = void 0;
class SqliteProjectFileRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findById(id) {
        const row = await this.knex('project_files').where({ id }).first();
        return row ? this.toDomain(row) : null;
    }
    async findAll() {
        const rows = await this.knex('project_files').orderBy('uploaded_at', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async save(entity) {
        const existing = await this.knex('project_files').where({ id: entity.id }).first();
        const row = this.toPersistence(entity);
        if (existing) {
            await this.knex('project_files').where({ id: entity.id }).update(row);
        }
        else {
            await this.knex('project_files').insert(row);
        }
    }
    async delete(id) {
        await this.knex('project_files').where({ id }).delete();
    }
    async findByProjectId(projectId) {
        const rows = await this.knex('project_files').where({ project_id: projectId }).orderBy('uploaded_at', 'desc');
        return rows.map((row) => this.toDomain(row));
    }
    async deleteByProjectId(projectId) {
        await this.knex('project_files').where({ project_id: projectId }).delete();
    }
    toDomain(row) {
        return {
            id: row.id,
            projectId: row.project_id,
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
    toPersistence(entity) {
        return {
            id: entity.id,
            project_id: entity.projectId,
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
exports.SqliteProjectFileRepository = SqliteProjectFileRepository;
//# sourceMappingURL=sqlite-project-file.repository.js.map
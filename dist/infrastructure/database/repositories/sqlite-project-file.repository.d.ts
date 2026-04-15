import { Knex } from 'knex';
import { IProjectFileRepository, ProjectFileRecord } from '@domains/project';
export declare class SqliteProjectFileRepository implements IProjectFileRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<ProjectFileRecord | null>;
    findAll(): Promise<ProjectFileRecord[]>;
    save(entity: ProjectFileRecord): Promise<void>;
    delete(id: string): Promise<void>;
    findByProjectId(projectId: string): Promise<ProjectFileRecord[]>;
    deleteByProjectId(projectId: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-project-file.repository.d.ts.map
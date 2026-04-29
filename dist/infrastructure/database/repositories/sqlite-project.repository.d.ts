import { Knex } from 'knex';
import { Project, ProjectStatus } from '../../../domains/project';
import { IProjectRepository } from '../../../domains/project';
/**
 * SQLite implementation of Project repository.
 */
export declare class SqliteProjectRepository implements IProjectRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Project | null>;
    findAll(): Promise<Project[]>;
    save(entity: Project): Promise<void>;
    delete(id: string): Promise<void>;
    findByCustomer(customerName: string): Promise<Project[]>;
    findByStatus(status: ProjectStatus): Promise<Project[]>;
    findActive(): Promise<Project[]>;
    private toDomain;
    private toPersistence;
    private toItemPersistence;
}
//# sourceMappingURL=sqlite-project.repository.d.ts.map
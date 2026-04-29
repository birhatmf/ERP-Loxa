import { Knex } from 'knex';
import { Check, CheckType, CheckStatus } from '../../../domains/payment';
import { ICheckRepository } from '../../../domains/payment';
/**
 * SQLite implementation of Check repository.
 */
export declare class SqliteCheckRepository implements ICheckRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Check | null>;
    findAll(): Promise<Check[]>;
    save(entity: Check): Promise<void>;
    delete(id: string): Promise<void>;
    findByStatus(status: CheckStatus): Promise<Check[]>;
    findByType(type: CheckType): Promise<Check[]>;
    findPending(): Promise<Check[]>;
    findOverdue(): Promise<Check[]>;
    findByDueDateRange(from: Date, to: Date): Promise<Check[]>;
    findByProject(projectId: string): Promise<Check[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-check.repository.d.ts.map
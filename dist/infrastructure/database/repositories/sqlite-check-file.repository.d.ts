import { Knex } from 'knex';
import { CheckFileRecord, ICheckFileRepository } from '@domains/payment';
export declare class SqliteCheckFileRepository implements ICheckFileRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<CheckFileRecord | null>;
    findAll(): Promise<CheckFileRecord[]>;
    save(entity: CheckFileRecord): Promise<void>;
    delete(id: string): Promise<void>;
    findByCheckId(checkId: string): Promise<CheckFileRecord[]>;
    deleteByCheckId(checkId: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-check-file.repository.d.ts.map
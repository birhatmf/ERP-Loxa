import { Knex } from 'knex';
import { Material } from '@domains/inventory';
import { IMaterialRepository } from '@domains/inventory';
/**
 * SQLite implementation of Material repository.
 */
export declare class SqliteMaterialRepository implements IMaterialRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Material | null>;
    findAll(): Promise<Material[]>;
    save(entity: Material): Promise<void>;
    delete(id: string): Promise<void>;
    findByName(name: string): Promise<Material | null>;
    findLowStock(): Promise<Material[]>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-material.repository.d.ts.map
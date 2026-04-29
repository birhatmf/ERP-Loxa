import { Knex } from 'knex';
import { Category } from '../../../domains/category/entities/category.entity';
import { ICategoryRepository } from '../../../domains/category/repositories/category.repository';
export declare class SqliteCategoryRepository implements ICategoryRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Category | null>;
    findAll(): Promise<Category[]>;
    findByType(type: string): Promise<Category[]>;
    save(entity: Category): Promise<void>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-category.repository.d.ts.map
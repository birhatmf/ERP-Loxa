import { Knex } from 'knex';
import { Sale } from '../../../domains/sale/entities/sale.entity';
import { ISaleRepository } from '../../../domains/sale/repositories/sale.repository';
export declare class SqliteSaleRepository implements ISaleRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Sale | null>;
    findAll(): Promise<Sale[]>;
    save(entity: Sale): Promise<void>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toSaleItem;
    private toSalePersistence;
}
//# sourceMappingURL=sqlite-sale.repository.d.ts.map
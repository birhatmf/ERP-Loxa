import { Knex } from 'knex';
export interface SupplierRecord {
    id: string;
    name: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    taxId: string;
    notes: string;
    totalOrders?: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class SqliteSupplierRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<SupplierRecord | null>;
    findAll(): Promise<SupplierRecord[]>;
    save(entity: SupplierRecord): Promise<void>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-supplier.repository.d.ts.map
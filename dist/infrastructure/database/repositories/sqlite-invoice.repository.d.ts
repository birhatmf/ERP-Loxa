import { Knex } from 'knex';
import { Invoice, InvoiceStatus } from '../../../domains/invoice';
import { IInvoiceRepository } from '../../../domains/invoice';
export declare class SqliteInvoiceRepository implements IInvoiceRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Invoice | null>;
    findAll(): Promise<Invoice[]>;
    save(entity: Invoice): Promise<void>;
    delete(id: string): Promise<void>;
    findByStatus(status: InvoiceStatus): Promise<Invoice[]>;
    findByProject(projectId: string): Promise<Invoice[]>;
    findByCustomer(customerId: string): Promise<Invoice[]>;
    findOverdue(): Promise<Invoice[]>;
    findByDateRange(from: Date, to: Date): Promise<Invoice[]>;
    private toDomain;
    private toPersistence;
    private toItemPersistence;
}
//# sourceMappingURL=sqlite-invoice.repository.d.ts.map
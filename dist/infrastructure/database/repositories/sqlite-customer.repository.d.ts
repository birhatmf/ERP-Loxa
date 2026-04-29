import { Knex } from 'knex';
import { Customer } from '../../../domains/customer';
import { ICustomerRepository } from '../../../domains/customer/repositories/customer.repository';
export declare class SqliteCustomerRepository implements ICustomerRepository {
    private knex;
    constructor(knex: Knex);
    findById(id: string): Promise<Customer | null>;
    findAll(): Promise<Customer[]>;
    save(entity: Customer): Promise<void>;
    delete(id: string): Promise<void>;
    private toDomain;
    private toPersistence;
}
//# sourceMappingURL=sqlite-customer.repository.d.ts.map
import { Customer } from '../entities/customer.entity';

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findAll(): Promise<Customer[]>;
  save(entity: Customer): Promise<void>;
  delete(id: string): Promise<void>;
}

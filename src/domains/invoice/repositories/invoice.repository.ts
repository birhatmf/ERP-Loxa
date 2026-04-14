import { IRepository } from '@shared/types/repository.interface';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceStatus } from '../entities/invoice.enums';

export interface IInvoiceRepository extends IRepository<Invoice> {
  findByStatus(status: InvoiceStatus): Promise<Invoice[]>;
  findByProject(projectId: string): Promise<Invoice[]>;
  findByCustomer(customerId: string): Promise<Invoice[]>;
  findOverdue(): Promise<Invoice[]>;
  findByDateRange(from: Date, to: Date): Promise<Invoice[]>;
}

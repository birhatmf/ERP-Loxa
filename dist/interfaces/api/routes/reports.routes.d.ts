import { Router } from 'express';
import { IInvoiceRepository } from '@domains/invoice';
import { IProjectRepository } from '@domains/project';
import { IMaterialRepository } from '@domains/inventory';
import { ITransactionRepository } from '@domains/finance';
export declare function createReportsRoutes(transactionRepo: ITransactionRepository, projectRepo: IProjectRepository, invoiceRepo: IInvoiceRepository, materialRepo: IMaterialRepository): Router;
//# sourceMappingURL=reports.routes.d.ts.map
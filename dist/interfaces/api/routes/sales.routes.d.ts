import { Router } from 'express';
import { ISaleRepository } from '../../../domains/sale/repositories/sale.repository';
import { IProjectRepository } from '../../../domains/project';
import { ITransactionRepository } from '../../../domains/finance';
export declare function createSalesRoutes(saleRepo: ISaleRepository, transactionRepo: ITransactionRepository, projectRepo: IProjectRepository): Router;
//# sourceMappingURL=sales.routes.d.ts.map
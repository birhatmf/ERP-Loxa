import { Router } from 'express';
import { IInvoiceRepository, InvoiceService } from '@domains/invoice';
import { EventBus } from '@shared/types';
export declare function createInvoiceRoutes(invoiceRepo: IInvoiceRepository, invoiceService: InvoiceService, eventBus: EventBus): Router;
//# sourceMappingURL=invoice.routes.d.ts.map
import { Router } from 'express';
import { SqliteSupplierRepository } from '@infrastructure/database/repositories/sqlite-supplier.repository';
import { SqlitePurchaseOrderRepository } from '@infrastructure/database/repositories/sqlite-purchase-order.repository';
import { IMaterialRepository } from '@domains/inventory';
import { StockService } from '@domains/inventory';
export declare function createProcurementRoutes(supplierRepo: SqliteSupplierRepository, orderRepo: SqlitePurchaseOrderRepository, materialRepo: IMaterialRepository, stockService: StockService): Router;
//# sourceMappingURL=procurement.routes.d.ts.map
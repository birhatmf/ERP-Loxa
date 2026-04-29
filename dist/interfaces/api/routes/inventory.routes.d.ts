import { Router } from 'express';
import { CreateMaterial, AddStock } from '../../../application/use-cases/inventory/inventory.use-cases';
import { IMaterialRepository, IStockMovementRepository, StockService } from '../../../domains/inventory';
import { SqlitePurchaseOrderRepository } from '../../../infrastructure/database/repositories/sqlite-purchase-order.repository';
export declare function createInventoryRoutes(createMaterial: CreateMaterial, addStock: AddStock, stockService: StockService, materialRepo: IMaterialRepository, purchaseOrderRepo: SqlitePurchaseOrderRepository, stockMovementRepo: IStockMovementRepository): Router;
//# sourceMappingURL=inventory.routes.d.ts.map
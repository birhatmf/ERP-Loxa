import { Router } from 'express';
import { CreateMaterial, AddStock } from '@application/use-cases/inventory/inventory.use-cases';
import { IMaterialRepository, StockService } from '@domains/inventory';
export declare function createInventoryRoutes(createMaterial: CreateMaterial, addStock: AddStock, stockService: StockService, materialRepo: IMaterialRepository): Router;
//# sourceMappingURL=inventory.routes.d.ts.map
import { Request, Response, Router } from 'express';
import { CreateMaterial, AddStock } from '@application/use-cases/inventory/inventory.use-cases';
import { IMaterialRepository, StockService, Unit } from '@domains/inventory';

export function createInventoryRoutes(
  createMaterial: CreateMaterial,
  addStock: AddStock,
  stockService: StockService,
  materialRepo: IMaterialRepository
): Router {
  const router = Router();

  // POST /materials - Create a new material
  router.post('/materials', async (req: Request, res: Response) => {
    try {
      const { name, unit, minStockLevel } = req.body;

      const material = await createMaterial.execute({
        name,
        unit: unit as Unit,
        minStockLevel,
      });

      res.status(201).json({
        id: material.id,
        name: material.name,
        unit: material.unit,
        currentStock: material.currentStock,
        minStockLevel: material.minStockLevel,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /materials - List all materials
  router.get('/materials', async (req: Request, res: Response) => {
    try {
      const materials = await materialRepo.findAll();
      res.json(materials.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        currentStock: m.currentStock,
        minStockLevel: m.minStockLevel,
        isLowStock: m.isLowStock,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /materials/low-stock - Get low stock materials
  router.get('/materials/low-stock', async (req: Request, res: Response) => {
    try {
      const lowStock = await stockService.getLowStockMaterials();
      res.json(lowStock.map(m => ({
        id: m.id,
        name: m.name,
        unit: m.unit,
        currentStock: m.currentStock,
        minStockLevel: m.minStockLevel,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /materials/:id/stock - Add stock
  router.post('/materials/:id/stock', async (req: Request, res: Response) => {
    try {
      const { quantity, description } = req.body;

      await addStock.execute({
        materialId: req.params.id,
        quantity,
        description,
      });

      const material = await materialRepo.findById(req.params.id);
      res.json({
        id: material!.id,
        name: material!.name,
        currentStock: material!.currentStock,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // GET /materials/:id/history - Get stock history
  router.get('/materials/:id/history', async (req: Request, res: Response) => {
    try {
      const movements = await stockService.getStockHistory(req.params.id);
      res.json(movements.map(m => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        description: m.description,
        date: m.date,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

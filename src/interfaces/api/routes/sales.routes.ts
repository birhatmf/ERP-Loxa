import { Request, Response, Router } from 'express';
import { Sale } from '@domains/sale/entities/sale.entity';
import { ISaleRepository } from '@domains/sale/repositories/sale.repository';
import { logger } from '@shared/logger';

const VALID_STATUSES = ['bekliyor', 'kısmi', 'ödendi'];

export function createSalesRoutes(
  saleRepo: ISaleRepository
): Router {
  const router = Router();

  // GET /sales - List all sales
  router.get('/', async (_req: Request, res: Response) => {
    try {
      const sales = await saleRepo.findAll();
      res.json(sales.map(s => s.toSafeObject()));
    } catch (error: any) {
      logger.error('Failed to list sales', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /sales/:id - Get sale details
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const sale = await saleRepo.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }
      res.json(sale.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to get sale', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  // POST /sales - Create a new sale
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { customerName, customerPhone, customerAddress, items, paymentMethod, paymentStatus, paymentNote, description } = req.body;

      if (!customerName || String(customerName).trim().length === 0) {
        return res.status(400).json({ error: 'Customer name is required' });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'At least one item is required' });
      }

      const sale = Sale.create({
        customerName: String(customerName).trim(),
        customerPhone: customerPhone ? String(customerPhone) : '',
        customerAddress: customerAddress ? String(customerAddress) : '',
        items: items.map((item: any) => ({
          description: String(item.description),
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0,
        })),
        paymentMethod: paymentMethod ? String(paymentMethod) : 'nakit',
        paymentStatus: VALID_STATUSES.includes(paymentStatus) ? paymentStatus : 'bekliyor',
        paymentNote: paymentNote ? String(paymentNote) : '',
        description: description ? String(description) : '',
      });

      await saleRepo.save(sale);

      logger.info('Sale created', { id: sale.id, customerName: sale.customerName, total: sale.totalAmount.amount });
      res.status(201).json(sale.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to create sale', { error: error.message, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /sales/:id - Update sale
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const sale = await saleRepo.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      const { paymentStatus, paymentMethod, paymentNote, description } = req.body;

      if (paymentStatus && !VALID_STATUSES.includes(paymentStatus)) {
        return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      }

      sale.updatePayment({
        paymentStatus: paymentStatus as any,
        paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
        paymentNote: paymentNote !== undefined ? String(paymentNote) : undefined,
      });

      if (description !== undefined) {
        sale.updateInfo({
          description: String(description),
        });
      }

      await saleRepo.save(sale);

      logger.info('Sale updated', { id: sale.id });
      res.json(sale.toSafeObject());
    } catch (error: any) {
      logger.error('Failed to update sale', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /sales/:id - Delete sale
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const sale = await saleRepo.findById(req.params.id);
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }

      await saleRepo.delete(req.params.id);
      logger.info('Sale deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete sale', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

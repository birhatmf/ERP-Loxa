import { Request, Response, Router } from 'express';
import { Invoice, InvoiceStatus, IInvoiceRepository, InvoiceService } from '@domains/invoice';
import { Money, EventBus } from '@shared/types';
import { logger } from '@shared/logger';

export function createInvoiceRoutes(
  invoiceRepo: IInvoiceRepository,
  invoiceService: InvoiceService,
  eventBus: EventBus
): Router {
  const router = Router();

  // POST /invoices - Create a new invoice
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { projectId, customerId, customerName, customerAddress, items, dueDate, notes, createdBy } = req.body;

      const invoice = Invoice.create({
        projectId,
        customerId,
        customerName,
        customerAddress,
        items: items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: Money.create(i.unitPrice),
          vatRate: i.vatRate ?? 18,
        })),
        dueDate: new Date(dueDate),
        notes,
        createdBy: createdBy ?? 'system',
      });

      await invoiceRepo.save(invoice);
      await eventBus.publishAll(invoice.domainEvents);
      invoice.clearEvents();

      logger.info('Invoice created', { id: invoice.id, invoiceNumber: invoice.invoiceNumber, customer: invoice.customerName });
      res.status(201).json({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        subtotal: invoice.subtotal.amount,
        totalVat: invoice.totalVat.amount,
        totalAmount: invoice.totalAmount.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
      });
    } catch (error: any) {
      logger.error('Failed to create invoice', { error: error.message, body: req.body });
      res.status(400).json({ error: error.message });
    }
  });

  // GET /invoices - List all invoices
  router.get('/', async (req: Request, res: Response) => {
    try {
      const invoices = await invoiceRepo.findAll();
      res.json(invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        totalAmount: inv.totalAmount.amount,
        status: inv.status,
        dueDate: inv.dueDate,
        paidDate: inv.paidDate,
        createdAt: inv.createdAt,
      })));
    } catch (error: any) {
      logger.error('Failed to list invoices', { error: error.message });
      res.status(500).json({ error: error.message });
    }
  });

  // GET /invoices/:id - Get invoice details
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const invoice = await invoiceRepo.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        projectId: invoice.projectId,
        customerName: invoice.customerName,
        customerAddress: invoice.customerAddress,
        items: invoice.items.map(i => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice.amount,
          vatRate: i.vatRate,
          totalPrice: i.totalPrice.amount,
          vatAmount: i.vatAmount.amount,
        })),
        subtotal: invoice.subtotal.amount,
        totalVat: invoice.totalVat.amount,
        totalAmount: invoice.totalAmount.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
        paidDate: invoice.paidDate,
        notes: invoice.notes,
        createdAt: invoice.createdAt,
      });
    } catch (error: any) {
      logger.error('Failed to get invoice', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  // PATCH /invoices/:id/send - Send invoice
  router.patch('/:id/send', async (req: Request, res: Response) => {
    try {
      const invoice = await invoiceRepo.findById(req.params.id);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      invoice.send();
      await invoiceRepo.save(invoice);
      await eventBus.publishAll(invoice.domainEvents);
      invoice.clearEvents();

      logger.info('Invoice sent', { id: invoice.id, status: invoice.status });
      res.json({ id: invoice.id, status: invoice.status });
    } catch (error: any) {
      logger.error('Failed to send invoice', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /invoices/:id/pay - Mark as paid
  router.patch('/:id/pay', async (req: Request, res: Response) => {
    try {
      const invoice = await invoiceRepo.findById(req.params.id);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      invoice.markAsPaid();
      await invoiceRepo.save(invoice);
      await eventBus.publishAll(invoice.domainEvents);
      invoice.clearEvents();

      logger.info('Invoice marked as paid', { id: invoice.id, paidDate: invoice.paidDate });
      res.json({ id: invoice.id, status: invoice.status, paidDate: invoice.paidDate });
    } catch (error: any) {
      logger.error('Failed to pay invoice', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // PATCH /invoices/:id - Update invoice
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const invoice = await invoiceRepo.findById(req.params.id);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      const { customerName, customerAddress, dueDate, notes } = req.body;

      invoice.updateInfo({
        customerName: customerName !== undefined ? String(customerName) : undefined,
        customerAddress: customerAddress !== undefined ? String(customerAddress) : undefined,
        dueDate: dueDate !== undefined ? new Date(dueDate) : undefined,
        notes: notes !== undefined ? String(notes) : undefined,
      });
      await invoiceRepo.save(invoice);

      logger.info('Invoice updated', { id: invoice.id });
      res.json({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        totalAmount: invoice.totalAmount.amount,
        vatAmount: invoice.totalVat.amount,
        grandTotal: invoice.totalAmount.amount + invoice.totalVat.amount,
        status: invoice.status,
        dueDate: invoice.dueDate,
      });
    } catch (error: any) {
      logger.error('Failed to update invoice', { error: error.message, id: req.params.id });
      res.status(400).json({ error: error.message });
    }
  });

  // DELETE /invoices/:id - Delete invoice
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      const invoice = await invoiceRepo.findById(req.params.id);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      await invoiceRepo.delete(req.params.id);
      logger.info('Invoice deleted', { id: req.params.id });
      res.status(204).send();
    } catch (error: any) {
      logger.error('Failed to delete invoice', { error: error.message, id: req.params.id });
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}

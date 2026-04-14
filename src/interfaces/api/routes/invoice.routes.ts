import { Request, Response, Router } from 'express';
import { Invoice, InvoiceStatus, IInvoiceRepository, InvoiceService } from '@domains/invoice';
import { Money, EventBus } from '@shared/types';

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

      res.json({ id: invoice.id, status: invoice.status });
    } catch (error: any) {
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

      res.json({ id: invoice.id, status: invoice.status, paidDate: invoice.paidDate });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return router;
}

import { Money, EventBus } from '@shared/types';
import { Invoice } from '../entities/invoice.entity';
import { InvoiceStatus } from '../entities/invoice.enums';
import { IInvoiceRepository } from '../repositories/invoice.repository';
import { InvoiceOverdueEvent } from '../events/invoice.events';

/**
 * InvoiceService - Domain Service
 * Manages invoice lifecycle and overdue processing.
 */
export class InvoiceService {
  constructor(
    private invoiceRepo: IInvoiceRepository,
    private eventBus: EventBus
  ) {}

  /**
   * Process overdue invoices.
   * Should be run periodically (daily job).
   */
  async processOverdueInvoices(): Promise<Invoice[]> {
    const overdueInvoices = await this.invoiceRepo.findOverdue();

    for (const invoice of overdueInvoices) {
      if (invoice.status === InvoiceStatus.SENT) {
        invoice.markAsOverdue();
        await this.invoiceRepo.save(invoice);
        await this.eventBus.publishAll(invoice.domainEvents);
        invoice.clearEvents();
      }
    }

    return overdueInvoices;
  }

  /**
   * Get invoice summary for a period.
   */
  async getSummary(from: Date, to: Date): Promise<{
    totalInvoiced: Money;
    totalPaid: Money;
    totalOutstanding: Money;
    invoiceCount: number;
    paidCount: number;
    overdueCount: number;
  }> {
    const invoices = await this.invoiceRepo.findByDateRange(from, to);

    let totalInvoiced = Money.zero();
    let totalPaid = Money.zero();
    let paidCount = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      totalInvoiced = totalInvoiced.add(inv.totalAmount);

      if (inv.status === InvoiceStatus.PAID) {
        totalPaid = totalPaid.add(inv.totalAmount);
        paidCount++;
      }

      if (inv.status === InvoiceStatus.OVERDUE) {
        overdueCount++;
      }
    }

    return {
      totalInvoiced,
      totalPaid,
      totalOutstanding: totalInvoiced.subtract(totalPaid),
      invoiceCount: invoices.length,
      paidCount,
      overdueCount,
    };
  }
}

import { Money, EventBus } from '../../../shared/types';
import { Invoice } from '../entities/invoice.entity';
import { IInvoiceRepository } from '../repositories/invoice.repository';
/**
 * InvoiceService - Domain Service
 * Manages invoice lifecycle and overdue processing.
 */
export declare class InvoiceService {
    private invoiceRepo;
    private eventBus;
    constructor(invoiceRepo: IInvoiceRepository, eventBus: EventBus);
    /**
     * Process overdue invoices.
     * Should be run periodically (daily job).
     */
    processOverdueInvoices(): Promise<Invoice[]>;
    /**
     * Get invoice summary for a period.
     */
    getSummary(from: Date, to: Date): Promise<{
        totalInvoiced: Money;
        totalPaid: Money;
        totalOutstanding: Money;
        invoiceCount: number;
        paidCount: number;
        overdueCount: number;
    }>;
}
//# sourceMappingURL=invoice.service.d.ts.map
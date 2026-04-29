"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const types_1 = require("../../../shared/types");
const invoice_enums_1 = require("../entities/invoice.enums");
/**
 * InvoiceService - Domain Service
 * Manages invoice lifecycle and overdue processing.
 */
class InvoiceService {
    invoiceRepo;
    eventBus;
    constructor(invoiceRepo, eventBus) {
        this.invoiceRepo = invoiceRepo;
        this.eventBus = eventBus;
    }
    /**
     * Process overdue invoices.
     * Should be run periodically (daily job).
     */
    async processOverdueInvoices() {
        const overdueInvoices = await this.invoiceRepo.findOverdue();
        for (const invoice of overdueInvoices) {
            if (invoice.status === invoice_enums_1.InvoiceStatus.SENT) {
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
    async getSummary(from, to) {
        const invoices = await this.invoiceRepo.findByDateRange(from, to);
        let totalInvoiced = types_1.Money.zero();
        let totalPaid = types_1.Money.zero();
        let paidCount = 0;
        let overdueCount = 0;
        for (const inv of invoices) {
            totalInvoiced = totalInvoiced.add(inv.totalAmount);
            if (inv.status === invoice_enums_1.InvoiceStatus.PAID) {
                totalPaid = totalPaid.add(inv.totalAmount);
                paidCount++;
            }
            if (inv.status === invoice_enums_1.InvoiceStatus.OVERDUE) {
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
exports.InvoiceService = InvoiceService;
//# sourceMappingURL=invoice.service.js.map
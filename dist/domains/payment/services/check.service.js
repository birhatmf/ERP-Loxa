"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckService = void 0;
const types_1 = require("@shared/types");
const payment_enums_1 = require("../entities/payment.enums");
const payment_events_1 = require("../events/payment.events");
/**
 * CheckService - Domain Service
 * Manages check lifecycle and due date monitoring.
 */
class CheckService {
    checkRepo;
    eventBus;
    auditService;
    constructor(checkRepo, eventBus, auditService) {
        this.checkRepo = checkRepo;
        this.eventBus = eventBus;
        this.auditService = auditService;
    }
    /**
     * Get all overdue checks and emit events.
     * Should be run periodically (e.g., daily job).
     */
    async processOverdueChecks() {
        const overdueChecks = await this.checkRepo.findOverdue();
        for (const check of overdueChecks) {
            const daysOverdue = Math.floor((Date.now() - check.dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const event = new payment_events_1.CheckOverdueEvent(check.id, check.amount, check.ownerName, check.dueDate, daysOverdue);
            await this.eventBus.publish(event);
        }
        void this.auditService.recordDomainAction({
            action: 'payment.checks.overdue.processed',
            message: `Processed overdue checks: ${overdueChecks.length}`,
            entityType: 'check',
            metadata: {
                count: overdueChecks.length,
                checkIds: overdueChecks.map(check => check.id),
            },
        });
        return overdueChecks;
    }
    /**
     * Get checks due within the next N days.
     */
    async getUpcomingDue(days = 7) {
        const from = new Date();
        const to = new Date();
        to.setDate(to.getDate() + days);
        return this.checkRepo.findByDueDateRange(from, to);
    }
    /**
     * Calculate total pending amount by type.
     */
    async calculatePendingTotals() {
        const pendingChecks = await this.checkRepo.findPending();
        let receivedTotal = types_1.Money.zero();
        let givenTotal = types_1.Money.zero();
        for (const check of pendingChecks) {
            if (check.type === payment_enums_1.CheckType.RECEIVED) {
                receivedTotal = receivedTotal.add(check.amount);
            }
            else {
                givenTotal = givenTotal.add(check.amount);
            }
        }
        return {
            received: receivedTotal,
            given: givenTotal,
            net: receivedTotal.subtract(givenTotal),
        };
    }
    /**
     * Get check summary for a period.
     */
    async getSummary(from, to) {
        const checks = await this.checkRepo.findByDueDateRange(from, to);
        let totalReceived = types_1.Money.zero();
        let totalGiven = types_1.Money.zero();
        let paidReceived = types_1.Money.zero();
        let paidGiven = types_1.Money.zero();
        let pendingReceived = types_1.Money.zero();
        let pendingGiven = types_1.Money.zero();
        let bouncedCount = 0;
        for (const check of checks) {
            if (check.type === payment_enums_1.CheckType.RECEIVED) {
                totalReceived = totalReceived.add(check.amount);
                if (check.isPaid)
                    paidReceived = paidReceived.add(check.amount);
                if (check.isPending)
                    pendingReceived = pendingReceived.add(check.amount);
            }
            else {
                totalGiven = totalGiven.add(check.amount);
                if (check.isPaid)
                    paidGiven = paidGiven.add(check.amount);
                if (check.isPending)
                    pendingGiven = pendingGiven.add(check.amount);
            }
            if (check.status === payment_enums_1.CheckStatus.BOUNCED)
                bouncedCount++;
        }
        return {
            totalReceived,
            totalGiven,
            paidReceived,
            paidGiven,
            pendingReceived,
            pendingGiven,
            bouncedCount,
        };
    }
}
exports.CheckService = CheckService;
//# sourceMappingURL=check.service.js.map
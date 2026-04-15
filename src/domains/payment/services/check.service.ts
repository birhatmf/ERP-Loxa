import { Money, EventBus } from '@shared/types';
import { Check } from '../entities/check.entity';
import { CheckType, CheckStatus } from '../entities/payment.enums';
import { ICheckRepository } from '../repositories/check.repository';
import { CheckOverdueEvent } from '../events/payment.events';
import { AuditService } from '@shared/audit/audit.service';

/**
 * CheckService - Domain Service
 * Manages check lifecycle and due date monitoring.
 */
export class CheckService {
  constructor(
    private checkRepo: ICheckRepository,
    private eventBus: EventBus,
    private auditService: AuditService
  ) {}

  /**
   * Get all overdue checks and emit events.
   * Should be run periodically (e.g., daily job).
   */
  async processOverdueChecks(): Promise<Check[]> {
    const overdueChecks = await this.checkRepo.findOverdue();

    for (const check of overdueChecks) {
      const daysOverdue = Math.floor(
        (Date.now() - check.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const event = new CheckOverdueEvent(
        check.id,
        check.amount,
        check.ownerName,
        check.dueDate,
        daysOverdue
      );

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
  async getUpcomingDue(days: number = 7): Promise<Check[]> {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);

    return this.checkRepo.findByDueDateRange(from, to);
  }

  /**
   * Calculate total pending amount by type.
   */
  async calculatePendingTotals(): Promise<{
    received: Money;
    given: Money;
    net: Money;
  }> {
    const pendingChecks = await this.checkRepo.findPending();

    let receivedTotal = Money.zero();
    let givenTotal = Money.zero();

    for (const check of pendingChecks) {
      if (check.type === CheckType.RECEIVED) {
        receivedTotal = receivedTotal.add(check.amount);
      } else {
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
  async getSummary(from: Date, to: Date): Promise<{
    totalReceived: Money;
    totalGiven: Money;
    paidReceived: Money;
    paidGiven: Money;
    pendingReceived: Money;
    pendingGiven: Money;
    bouncedCount: number;
  }> {
    const checks = await this.checkRepo.findByDueDateRange(from, to);

    let totalReceived = Money.zero();
    let totalGiven = Money.zero();
    let paidReceived = Money.zero();
    let paidGiven = Money.zero();
    let pendingReceived = Money.zero();
    let pendingGiven = Money.zero();
    let bouncedCount = 0;

    for (const check of checks) {
      if (check.type === CheckType.RECEIVED) {
        totalReceived = totalReceived.add(check.amount);
        if (check.isPaid) paidReceived = paidReceived.add(check.amount);
        if (check.isPending) pendingReceived = pendingReceived.add(check.amount);
      } else {
        totalGiven = totalGiven.add(check.amount);
        if (check.isPaid) paidGiven = paidGiven.add(check.amount);
        if (check.isPending) pendingGiven = pendingGiven.add(check.amount);
      }
      if (check.status === CheckStatus.BOUNCED) bouncedCount++;
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

import { DomainEvent, Money } from '../../../shared/types';
import { CheckType } from '../entities/payment.enums';
/**
 * Fired when a new check is created.
 */
export declare class CheckCreatedEvent extends DomainEvent {
    readonly checkType: CheckType;
    readonly amount: Money;
    readonly dueDate: Date;
    constructor(checkId: string, checkType: CheckType, amount: Money, dueDate: Date);
}
/**
 * Fired when a check is paid.
 * This triggers creation of a corresponding Transaction.
 */
export declare class CheckPaidEvent extends DomainEvent {
    readonly checkType: CheckType;
    readonly amount: Money;
    readonly paidDate: Date;
    constructor(checkId: string, checkType: CheckType, amount: Money, paidDate: Date);
}
/**
 * Fired when a check bounces (karşılıksız).
 */
export declare class CheckBouncedEvent extends DomainEvent {
    readonly amount: Money;
    readonly ownerName: string;
    constructor(checkId: string, amount: Money, ownerName: string);
}
/**
 * Fired when a check is cancelled.
 */
export declare class CheckCancelledEvent extends DomainEvent {
    constructor(checkId: string);
}
/**
 * Fired when a check becomes overdue.
 */
export declare class CheckOverdueEvent extends DomainEvent {
    readonly amount: Money;
    readonly ownerName: string;
    readonly dueDate: Date;
    readonly daysOverdue: number;
    constructor(checkId: string, amount: Money, ownerName: string, dueDate: Date, daysOverdue: number);
}
//# sourceMappingURL=payment.events.d.ts.map
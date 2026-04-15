import { AggregateRoot, Money } from '@shared/types';
import { TransactionType } from './transaction.enums';
import { RecurringFrequency } from './recurring-transaction.enums';
interface RecurringTransactionProps {
    id: string;
    description: string;
    amount: Money;
    type: TransactionType;
    category: string;
    paymentMethod: string;
    frequency: RecurringFrequency;
    dayOfMonth: number;
    isActive: boolean;
    nextRun: Date;
    lastRun?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class RecurringTransaction extends AggregateRoot {
    private _description;
    private _amount;
    private _type;
    private _category;
    private _paymentMethod;
    private _frequency;
    private _dayOfMonth;
    private _isActive;
    private _nextRun;
    private _lastRun?;
    private constructor();
    static create(params: {
        description: string;
        amount: number;
        type: TransactionType;
        category: string;
        paymentMethod: string;
        frequency: RecurringFrequency;
        dayOfMonth: number;
        createdAt?: Date;
    }): RecurringTransaction;
    static reconstitute(props: RecurringTransactionProps): RecurringTransaction;
    get description(): string;
    get amount(): Money;
    get type(): TransactionType;
    get category(): string;
    get paymentMethod(): string;
    get frequency(): RecurringFrequency;
    get dayOfMonth(): number;
    get isActive(): boolean;
    get nextRun(): Date;
    get lastRun(): Date | undefined;
    setActive(isActive: boolean): void;
    markRun(runDate?: Date): void;
    private static calculateNextRun;
}
export {};
//# sourceMappingURL=recurring-transaction.entity.d.ts.map
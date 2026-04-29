import { AggregateRoot, Money } from '../../../shared/types';
export type BudgetType = 'income' | 'expense';
interface BudgetItemProps {
    id: string;
    category: string;
    type: BudgetType;
    planned: Money;
    period: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class BudgetItem extends AggregateRoot {
    private _category;
    private _type;
    private _planned;
    private _period;
    private constructor();
    static create(params: {
        category: string;
        type: BudgetType;
        planned: number;
        period?: string;
    }): BudgetItem;
    static reconstitute(props: BudgetItemProps): BudgetItem;
    get category(): string;
    get type(): BudgetType;
    get planned(): Money;
    get period(): string;
    updateInfo(params: {
        category?: string;
        type?: BudgetType;
        planned?: number;
        period?: string;
    }): void;
    toSafeObject(): {
        id: string;
        category: string;
        type: BudgetType;
        planned: number;
        period: string;
        createdAt: Date;
        updatedAt: Date;
    };
}
export {};
//# sourceMappingURL=budget-item.entity.d.ts.map
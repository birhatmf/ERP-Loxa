import { AggregateRoot, Money } from '../../../shared/types';
import { ProjectStatus } from './project.enums';
import { ProjectItem } from './project-item.entity';
interface ProjectProps {
    id: string;
    name: string;
    customerName: string;
    description: string;
    startDate: Date;
    endDate?: Date;
    status: ProjectStatus;
    totalPrice: Money;
    items: ProjectItem[];
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Project Aggregate Root.
 * A customer job/project with items and cost tracking.
 *
 * RULE: ProjectItems can only be added through the Project aggregate.
 */
export declare class Project extends AggregateRoot {
    private _name;
    private _customerName;
    private _description;
    private _startDate;
    private _endDate?;
    private _status;
    private _totalPrice;
    private _items;
    private constructor();
    static create(params: {
        name: string;
        customerName: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        totalPrice: Money;
    }): Project;
    static reconstitute(props: ProjectProps): Project;
    get name(): string;
    get customerName(): string;
    get description(): string;
    get startDate(): Date;
    get endDate(): Date | undefined;
    get status(): ProjectStatus;
    get totalPrice(): Money;
    get items(): ProjectItem[];
    get itemCount(): number;
    /**
     * Calculate total cost from all items.
     */
    get totalCost(): Money;
    /**
     * Calculate profit margin.
     */
    get profitMargin(): Money;
    /**
     * Add an item to the project.
     * This triggers stock deduction and cost recalculation.
     */
    addItem(params: {
        materialId: string;
        quantity: number;
        unitPrice: Money;
    }): ProjectItem;
    /**
     * Remove an item from the project.
     */
    removeItem(itemId: string): void;
    /**
     * Update project status with valid transitions.
     */
    updateStatus(newStatus: ProjectStatus): void;
    /**
     * Update project info.
     */
    updateInfo(params: {
        name?: string;
        customerName?: string;
        description?: string;
        totalPrice?: Money;
    }): void;
}
export {};
//# sourceMappingURL=project.entity.d.ts.map
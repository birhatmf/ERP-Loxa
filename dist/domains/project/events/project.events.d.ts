import { DomainEvent, Money } from '../../../shared/types';
import { ProjectStatus } from '../entities/project.enums';
/**
 * Fired when a new project is created.
 */
export declare class ProjectCreatedEvent extends DomainEvent {
    readonly projectName: string;
    readonly customerName: string;
    constructor(projectId: string, projectName: string, customerName: string);
}
/**
 * Fired when an item is added to a project.
 * This event triggers stock deduction.
 */
export declare class ProjectItemAddedEvent extends DomainEvent {
    readonly itemId: string;
    readonly materialId: string;
    readonly quantity: number;
    readonly totalPrice: Money;
    constructor(projectId: string, itemId: string, materialId: string, quantity: number, totalPrice: Money);
}
/**
 * Fired when an item is removed from a project.
 */
export declare class ProjectItemRemovedEvent extends DomainEvent {
    readonly itemId: string;
    readonly materialId: string;
    readonly quantity: number;
    constructor(projectId: string, itemId: string, materialId: string, quantity: number);
}
/**
 * Fired when project status changes.
 */
export declare class ProjectStatusChangedEvent extends DomainEvent {
    readonly oldStatus: ProjectStatus;
    readonly newStatus: ProjectStatus;
    constructor(projectId: string, oldStatus: ProjectStatus, newStatus: ProjectStatus);
}
/**
 * Fired when project cost is recalculated.
 */
export declare class ProjectCostCalculatedEvent extends DomainEvent {
    readonly totalCost: Money;
    readonly totalPrice: Money;
    readonly profitMargin: Money;
    constructor(projectId: string, totalCost: Money, totalPrice: Money, profitMargin: Money);
}
//# sourceMappingURL=project.events.d.ts.map
import { DomainEvent, Money } from '@shared/types';
import { ProjectStatus } from '../entities/project.enums';

/**
 * Fired when a new project is created.
 */
export class ProjectCreatedEvent extends DomainEvent {
  public readonly projectName: string;
  public readonly customerName: string;

  constructor(projectId: string, projectName: string, customerName: string) {
    super(projectId, 'ProjectCreated');
    this.projectName = projectName;
    this.customerName = customerName;
  }
}

/**
 * Fired when an item is added to a project.
 * This event triggers stock deduction.
 */
export class ProjectItemAddedEvent extends DomainEvent {
  public readonly itemId: string;
  public readonly materialId: string;
  public readonly quantity: number;
  public readonly totalPrice: Money;

  constructor(
    projectId: string,
    itemId: string,
    materialId: string,
    quantity: number,
    totalPrice: Money
  ) {
    super(projectId, 'ProjectItemAdded');
    this.itemId = itemId;
    this.materialId = materialId;
    this.quantity = quantity;
    this.totalPrice = totalPrice;
  }
}

/**
 * Fired when an item is removed from a project.
 */
export class ProjectItemRemovedEvent extends DomainEvent {
  public readonly itemId: string;
  public readonly materialId: string;
  public readonly quantity: number;

  constructor(projectId: string, itemId: string, materialId: string, quantity: number) {
    super(projectId, 'ProjectItemRemoved');
    this.itemId = itemId;
    this.materialId = materialId;
    this.quantity = quantity;
  }
}

/**
 * Fired when project status changes.
 */
export class ProjectStatusChangedEvent extends DomainEvent {
  public readonly oldStatus: ProjectStatus;
  public readonly newStatus: ProjectStatus;

  constructor(projectId: string, oldStatus: ProjectStatus, newStatus: ProjectStatus) {
    super(projectId, 'ProjectStatusChanged');
    this.oldStatus = oldStatus;
    this.newStatus = newStatus;
  }
}

/**
 * Fired when project cost is recalculated.
 */
export class ProjectCostCalculatedEvent extends DomainEvent {
  public readonly totalCost: Money;
  public readonly totalPrice: Money;
  public readonly profitMargin: Money;

  constructor(
    projectId: string,
    totalCost: Money,
    totalPrice: Money,
    profitMargin: Money
  ) {
    super(projectId, 'ProjectCostCalculated');
    this.totalCost = totalCost;
    this.totalPrice = totalPrice;
    this.profitMargin = profitMargin;
  }
}

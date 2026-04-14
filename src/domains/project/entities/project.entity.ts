import { AggregateRoot, Money, generateId, BusinessRuleViolationError } from '@shared/types';
import { ProjectStatus } from './project.enums';
import { ProjectItem } from './project-item.entity';
import {
  ProjectCreatedEvent,
  ProjectItemAddedEvent,
  ProjectItemRemovedEvent,
  ProjectStatusChangedEvent,
} from '../events/project.events';

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
export class Project extends AggregateRoot {
  private _name: string;
  private _customerName: string;
  private _description: string;
  private _startDate: Date;
  private _endDate?: Date;
  private _status: ProjectStatus;
  private _totalPrice: Money;
  private _items: ProjectItem[];

  private constructor(props: ProjectProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._customerName = props.customerName;
    this._description = props.description;
    this._startDate = props.startDate;
    this._endDate = props.endDate;
    this._status = props.status;
    this._totalPrice = props.totalPrice;
    this._items = props.items;
  }

  static create(params: {
    name: string;
    customerName: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    totalPrice: Money;
  }): Project {
    if (!params.name || params.name.trim().length === 0) {
      throw new BusinessRuleViolationError('Project name is required');
    }
    if (!params.customerName || params.customerName.trim().length === 0) {
      throw new BusinessRuleViolationError('Customer name is required');
    }

    const now = new Date();
    const project = new Project({
      id: generateId(),
      name: params.name.trim(),
      customerName: params.customerName.trim(),
      description: params.description ?? '',
      startDate: params.startDate ?? now,
      endDate: params.endDate,
      status: ProjectStatus.DRAFT,
      totalPrice: params.totalPrice,
      items: [],
      createdAt: now,
      updatedAt: now,
    });

    project.addDomainEvent(
      new ProjectCreatedEvent(project.id, project._name, project._customerName)
    );

    return project;
  }

  static reconstitute(props: ProjectProps): Project {
    return new Project(props);
  }

  // --- Getters ---
  get name(): string { return this._name; }
  get customerName(): string { return this._customerName; }
  get description(): string { return this._description; }
  get startDate(): Date { return this._startDate; }
  get endDate(): Date | undefined { return this._endDate; }
  get status(): ProjectStatus { return this._status; }
  get totalPrice(): Money { return this._totalPrice; }
  get items(): ProjectItem[] { return [...this._items]; }
  get itemCount(): number { return this._items.length; }

  /**
   * Calculate total cost from all items.
   */
  get totalCost(): Money {
    return this._items.reduce(
      (sum, item) => sum.add(item.totalPrice),
      Money.zero(this._totalPrice.currency)
    );
  }

  /**
   * Calculate profit margin.
   */
  get profitMargin(): Money {
    return this._totalPrice.subtract(this.totalCost);
  }

  // --- Domain behavior ---

  /**
   * Add an item to the project.
   * This triggers stock deduction and cost recalculation.
   */
  addItem(params: {
    materialId: string;
    quantity: number;
    unitPrice: Money;
  }): ProjectItem {
    if (this._status === ProjectStatus.COMPLETED) {
      throw new BusinessRuleViolationError('Cannot add items to a completed project');
    }
    if (this._status === ProjectStatus.CANCELLED) {
      throw new BusinessRuleViolationError('Cannot add items to a cancelled project');
    }

    const item = ProjectItem.create({
      projectId: this.id,
      materialId: params.materialId,
      quantity: params.quantity,
      unitPrice: params.unitPrice,
    });

    this._items.push(item);
    this.touch();

    this.addDomainEvent(
      new ProjectItemAddedEvent(
        this.id,
        item.id,
        params.materialId,
        params.quantity,
        item.totalPrice
      )
    );

    return item;
  }

  /**
   * Remove an item from the project.
   */
  removeItem(itemId: string): void {
    const index = this._items.findIndex(i => i.id === itemId);
    if (index === -1) {
      throw new BusinessRuleViolationError(`Project item not found: ${itemId}`);
    }

    const item = this._items[index];
    this._items.splice(index, 1);
    this.touch();

    this.addDomainEvent(
      new ProjectItemRemovedEvent(this.id, item.id, item.materialId, item.quantity)
    );
  }

  /**
   * Update project status with valid transitions.
   */
  updateStatus(newStatus: ProjectStatus): void {
    const validTransitions: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.DRAFT]: [ProjectStatus.ACTIVE, ProjectStatus.CANCELLED],
      [ProjectStatus.ACTIVE]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
      [ProjectStatus.IN_PROGRESS]: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
      [ProjectStatus.COMPLETED]: [],
      [ProjectStatus.CANCELLED]: [],
    };

    if (!validTransitions[this._status].includes(newStatus)) {
      throw new BusinessRuleViolationError(
        `Invalid status transition: ${this._status} → ${newStatus}`
      );
    }

    const oldStatus = this._status;
    this._status = newStatus;

    if (newStatus === ProjectStatus.COMPLETED) {
      this._endDate = new Date();
    }

    this.touch();

    this.addDomainEvent(
      new ProjectStatusChangedEvent(this.id, oldStatus, newStatus)
    );
  }

  /**
   * Update project info.
   */
  updateInfo(params: {
    name?: string;
    customerName?: string;
    description?: string;
    totalPrice?: Money;
  }): void {
    if (params.name !== undefined) {
      if (!params.name || params.name.trim().length === 0) {
        throw new BusinessRuleViolationError('Project name cannot be empty');
      }
      this._name = params.name.trim();
    }
    if (params.customerName !== undefined) {
      this._customerName = params.customerName.trim();
    }
    if (params.description !== undefined) {
      this._description = params.description;
    }
    if (params.totalPrice !== undefined) {
      this._totalPrice = params.totalPrice;
    }
    this.touch();
  }
}

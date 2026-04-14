import { Money, EventBus, InsufficientStockError } from '@shared/types';
import { Project, ProjectStatus } from '@domains/project';
import { IProjectRepository } from '@domains/project';
import { StockService } from '@domains/inventory';

/**
 * CreateProject Use Case
 * Creates a new project with initial info.
 */
export class CreateProject {
  constructor(
    private projectRepo: IProjectRepository,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    name: string;
    customerName: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    totalPrice: number;
    currency?: string;
  }): Promise<Project> {
    const project = Project.create({
      name: params.name,
      customerName: params.customerName,
      description: params.description,
      startDate: params.startDate,
      endDate: params.endDate,
      totalPrice: Money.create(params.totalPrice, params.currency),
    });

    await this.projectRepo.save(project);
    await this.eventBus.publishAll(project.domainEvents);
    project.clearEvents();

    return project;
  }
}

/**
 * AddProjectItem Use Case
 * Adds an item to a project, automatically deducting stock.
 *
 * This is a critical use case that coordinates:
 * 1. Project aggregate (add item)
 * 2. Inventory domain (deduct stock)
 */
export class AddProjectItem {
  constructor(
    private projectRepo: IProjectRepository,
    private stockService: StockService,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    projectId: string;
    materialId: string;
    quantity: number;
    unitPrice: number;
    currency?: string;
  }): Promise<Project> {
    const project = await this.projectRepo.findById(params.projectId);
    if (!project) {
      throw new Error(`Project not found: ${params.projectId}`);
    }

    // 1. Check stock availability first
    const currentStock = await this.stockService.getStockLevel(params.materialId);
    if (currentStock < params.quantity) {
      throw new InsufficientStockError(params.materialId, params.quantity, currentStock);
    }

    // 2. Add item to project (triggers ProjectItemAddedEvent)
    project.addItem({
      materialId: params.materialId,
      quantity: params.quantity,
      unitPrice: Money.create(params.unitPrice, params.currency),
    });

    // 3. Deduct stock (creates StockMovement)
    await this.stockService.removeStock({
      materialId: params.materialId,
      quantity: params.quantity,
      description: `Project ${project.name} - ${project.customerName}`,
      relatedProjectId: project.id,
    });

    // 4. Save project
    await this.projectRepo.save(project);
    await this.eventBus.publishAll(project.domainEvents);
    project.clearEvents();

    return project;
  }
}

/**
 * UpdateProjectStatus Use Case
 * Transitions project to a new status.
 */
export class UpdateProjectStatus {
  constructor(
    private projectRepo: IProjectRepository,
    private eventBus: EventBus
  ) {}

  async execute(params: {
    projectId: string;
    newStatus: ProjectStatus;
  }): Promise<Project> {
    const project = await this.projectRepo.findById(params.projectId);
    if (!project) {
      throw new Error(`Project not found: ${params.projectId}`);
    }

    project.updateStatus(params.newStatus);

    await this.projectRepo.save(project);
    await this.eventBus.publishAll(project.domainEvents);
    project.clearEvents();

    return project;
  }
}

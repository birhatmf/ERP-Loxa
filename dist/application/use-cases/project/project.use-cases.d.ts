import { EventBus } from '../../../shared/types';
import { Project, ProjectStatus } from '../../../domains/project';
import { IProjectFileRepository, IProjectRepository } from '../../../domains/project';
import { StockService } from '../../../domains/inventory';
/**
 * CreateProject Use Case
 * Creates a new project with initial info.
 */
export declare class CreateProject {
    private projectRepo;
    private eventBus;
    constructor(projectRepo: IProjectRepository, eventBus: EventBus);
    execute(params: {
        name: string;
        customerName: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        totalPrice: number;
        currency?: string;
    }): Promise<Project>;
}
/**
 * AddProjectItem Use Case
 * Adds an item to a project, automatically deducting stock.
 *
 * This is a critical use case that coordinates:
 * 1. Project aggregate (add item)
 * 2. Inventory domain (deduct stock)
 */
export declare class AddProjectItem {
    private projectRepo;
    private stockService;
    private eventBus;
    constructor(projectRepo: IProjectRepository, stockService: StockService, eventBus: EventBus);
    execute(params: {
        projectId: string;
        materialId: string;
        quantity: number;
        unitPrice: number;
        currency?: string;
    }): Promise<Project>;
}
/**
 * UpdateProjectStatus Use Case
 * Transitions project to a new status.
 */
export declare class UpdateProjectStatus {
    private projectRepo;
    private eventBus;
    constructor(projectRepo: IProjectRepository, eventBus: EventBus);
    execute(params: {
        projectId: string;
        newStatus: ProjectStatus;
    }): Promise<Project>;
}
/**
 * UpdateProjectInfo Use Case
 * Updates editable project fields without changing lifecycle state.
 */
export declare class UpdateProjectInfo {
    private projectRepo;
    private eventBus;
    constructor(projectRepo: IProjectRepository, eventBus: EventBus);
    execute(params: {
        projectId: string;
        name?: string;
        customerName?: string;
        description?: string;
        totalPrice?: number;
        currency?: string;
    }): Promise<Project>;
}
/**
 * DeleteProject Use Case
 * Removes a project and its items.
 */
export declare class DeleteProject {
    private projectRepo;
    private projectFileRepo;
    constructor(projectRepo: IProjectRepository, projectFileRepo: IProjectFileRepository);
    execute(projectId: string): Promise<void>;
}
//# sourceMappingURL=project.use-cases.d.ts.map
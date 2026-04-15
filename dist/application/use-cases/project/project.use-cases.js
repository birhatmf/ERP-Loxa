"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteProject = exports.UpdateProjectInfo = exports.UpdateProjectStatus = exports.AddProjectItem = exports.CreateProject = void 0;
const types_1 = require("@shared/types");
const project_1 = require("@domains/project");
/**
 * CreateProject Use Case
 * Creates a new project with initial info.
 */
class CreateProject {
    projectRepo;
    eventBus;
    constructor(projectRepo, eventBus) {
        this.projectRepo = projectRepo;
        this.eventBus = eventBus;
    }
    async execute(params) {
        const project = project_1.Project.create({
            name: params.name,
            customerName: params.customerName,
            description: params.description,
            startDate: params.startDate,
            endDate: params.endDate,
            totalPrice: types_1.Money.create(params.totalPrice, params.currency),
        });
        await this.projectRepo.save(project);
        await this.eventBus.publishAll(project.domainEvents);
        project.clearEvents();
        return project;
    }
}
exports.CreateProject = CreateProject;
/**
 * AddProjectItem Use Case
 * Adds an item to a project, automatically deducting stock.
 *
 * This is a critical use case that coordinates:
 * 1. Project aggregate (add item)
 * 2. Inventory domain (deduct stock)
 */
class AddProjectItem {
    projectRepo;
    stockService;
    eventBus;
    constructor(projectRepo, stockService, eventBus) {
        this.projectRepo = projectRepo;
        this.stockService = stockService;
        this.eventBus = eventBus;
    }
    async execute(params) {
        const project = await this.projectRepo.findById(params.projectId);
        if (!project) {
            throw new Error(`Project not found: ${params.projectId}`);
        }
        // 1. Check stock availability first
        const currentStock = await this.stockService.getStockLevel(params.materialId);
        if (currentStock < params.quantity) {
            throw new types_1.InsufficientStockError(params.materialId, params.quantity, currentStock);
        }
        // 2. Add item to project (triggers ProjectItemAddedEvent)
        project.addItem({
            materialId: params.materialId,
            quantity: params.quantity,
            unitPrice: types_1.Money.create(params.unitPrice, params.currency),
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
exports.AddProjectItem = AddProjectItem;
/**
 * UpdateProjectStatus Use Case
 * Transitions project to a new status.
 */
class UpdateProjectStatus {
    projectRepo;
    eventBus;
    constructor(projectRepo, eventBus) {
        this.projectRepo = projectRepo;
        this.eventBus = eventBus;
    }
    async execute(params) {
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
exports.UpdateProjectStatus = UpdateProjectStatus;
/**
 * UpdateProjectInfo Use Case
 * Updates editable project fields without changing lifecycle state.
 */
class UpdateProjectInfo {
    projectRepo;
    eventBus;
    constructor(projectRepo, eventBus) {
        this.projectRepo = projectRepo;
        this.eventBus = eventBus;
    }
    async execute(params) {
        const project = await this.projectRepo.findById(params.projectId);
        if (!project) {
            throw new Error(`Project not found: ${params.projectId}`);
        }
        project.updateInfo({
            name: params.name,
            customerName: params.customerName,
            description: params.description,
            totalPrice: params.totalPrice !== undefined
                ? types_1.Money.create(params.totalPrice, params.currency)
                : undefined,
        });
        await this.projectRepo.save(project);
        await this.eventBus.publishAll(project.domainEvents);
        project.clearEvents();
        return project;
    }
}
exports.UpdateProjectInfo = UpdateProjectInfo;
/**
 * DeleteProject Use Case
 * Removes a project and its items.
 */
class DeleteProject {
    projectRepo;
    projectFileRepo;
    constructor(projectRepo, projectFileRepo) {
        this.projectRepo = projectRepo;
        this.projectFileRepo = projectFileRepo;
    }
    async execute(projectId) {
        const project = await this.projectRepo.findById(projectId);
        if (!project) {
            throw new Error(`Project not found: ${projectId}`);
        }
        await this.projectFileRepo.deleteByProjectId(projectId);
        await this.projectRepo.delete(projectId);
    }
}
exports.DeleteProject = DeleteProject;
//# sourceMappingURL=project.use-cases.js.map
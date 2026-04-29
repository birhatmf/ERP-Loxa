"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectCostCalculatedEvent = exports.ProjectStatusChangedEvent = exports.ProjectItemRemovedEvent = exports.ProjectItemAddedEvent = exports.ProjectCreatedEvent = void 0;
const types_1 = require("../../../shared/types");
/**
 * Fired when a new project is created.
 */
class ProjectCreatedEvent extends types_1.DomainEvent {
    projectName;
    customerName;
    constructor(projectId, projectName, customerName) {
        super(projectId, 'ProjectCreated');
        this.projectName = projectName;
        this.customerName = customerName;
    }
}
exports.ProjectCreatedEvent = ProjectCreatedEvent;
/**
 * Fired when an item is added to a project.
 * This event triggers stock deduction.
 */
class ProjectItemAddedEvent extends types_1.DomainEvent {
    itemId;
    materialId;
    quantity;
    totalPrice;
    constructor(projectId, itemId, materialId, quantity, totalPrice) {
        super(projectId, 'ProjectItemAdded');
        this.itemId = itemId;
        this.materialId = materialId;
        this.quantity = quantity;
        this.totalPrice = totalPrice;
    }
}
exports.ProjectItemAddedEvent = ProjectItemAddedEvent;
/**
 * Fired when an item is removed from a project.
 */
class ProjectItemRemovedEvent extends types_1.DomainEvent {
    itemId;
    materialId;
    quantity;
    constructor(projectId, itemId, materialId, quantity) {
        super(projectId, 'ProjectItemRemoved');
        this.itemId = itemId;
        this.materialId = materialId;
        this.quantity = quantity;
    }
}
exports.ProjectItemRemovedEvent = ProjectItemRemovedEvent;
/**
 * Fired when project status changes.
 */
class ProjectStatusChangedEvent extends types_1.DomainEvent {
    oldStatus;
    newStatus;
    constructor(projectId, oldStatus, newStatus) {
        super(projectId, 'ProjectStatusChanged');
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }
}
exports.ProjectStatusChangedEvent = ProjectStatusChangedEvent;
/**
 * Fired when project cost is recalculated.
 */
class ProjectCostCalculatedEvent extends types_1.DomainEvent {
    totalCost;
    totalPrice;
    profitMargin;
    constructor(projectId, totalCost, totalPrice, profitMargin) {
        super(projectId, 'ProjectCostCalculated');
        this.totalCost = totalCost;
        this.totalPrice = totalPrice;
        this.profitMargin = profitMargin;
    }
}
exports.ProjectCostCalculatedEvent = ProjectCostCalculatedEvent;
//# sourceMappingURL=project.events.js.map
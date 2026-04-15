"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Project = void 0;
const types_1 = require("@shared/types");
const project_enums_1 = require("./project.enums");
const project_item_entity_1 = require("./project-item.entity");
const project_events_1 = require("../events/project.events");
/**
 * Project Aggregate Root.
 * A customer job/project with items and cost tracking.
 *
 * RULE: ProjectItems can only be added through the Project aggregate.
 */
class Project extends types_1.AggregateRoot {
    _name;
    _customerName;
    _description;
    _startDate;
    _endDate;
    _status;
    _totalPrice;
    _items;
    constructor(props) {
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
    static create(params) {
        if (!params.name || params.name.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Project name is required');
        }
        if (!params.customerName || params.customerName.trim().length === 0) {
            throw new types_1.BusinessRuleViolationError('Customer name is required');
        }
        const now = new Date();
        const project = new Project({
            id: (0, types_1.generateId)(),
            name: params.name.trim(),
            customerName: params.customerName.trim(),
            description: params.description ?? '',
            startDate: params.startDate ?? now,
            endDate: params.endDate,
            status: project_enums_1.ProjectStatus.DRAFT,
            totalPrice: params.totalPrice,
            items: [],
            createdAt: now,
            updatedAt: now,
        });
        project.addDomainEvent(new project_events_1.ProjectCreatedEvent(project.id, project._name, project._customerName));
        return project;
    }
    static reconstitute(props) {
        return new Project(props);
    }
    // --- Getters ---
    get name() { return this._name; }
    get customerName() { return this._customerName; }
    get description() { return this._description; }
    get startDate() { return this._startDate; }
    get endDate() { return this._endDate; }
    get status() { return this._status; }
    get totalPrice() { return this._totalPrice; }
    get items() { return [...this._items]; }
    get itemCount() { return this._items.length; }
    /**
     * Calculate total cost from all items.
     */
    get totalCost() {
        return this._items.reduce((sum, item) => sum.add(item.totalPrice), types_1.Money.zero(this._totalPrice.currency));
    }
    /**
     * Calculate profit margin.
     */
    get profitMargin() {
        return this._totalPrice.subtract(this.totalCost);
    }
    // --- Domain behavior ---
    /**
     * Add an item to the project.
     * This triggers stock deduction and cost recalculation.
     */
    addItem(params) {
        if (this._status === project_enums_1.ProjectStatus.COMPLETED) {
            throw new types_1.BusinessRuleViolationError('Cannot add items to a completed project');
        }
        if (this._status === project_enums_1.ProjectStatus.CANCELLED) {
            throw new types_1.BusinessRuleViolationError('Cannot add items to a cancelled project');
        }
        const item = project_item_entity_1.ProjectItem.create({
            projectId: this.id,
            materialId: params.materialId,
            quantity: params.quantity,
            unitPrice: params.unitPrice,
        });
        this._items.push(item);
        this.touch();
        this.addDomainEvent(new project_events_1.ProjectItemAddedEvent(this.id, item.id, params.materialId, params.quantity, item.totalPrice));
        return item;
    }
    /**
     * Remove an item from the project.
     */
    removeItem(itemId) {
        const index = this._items.findIndex(i => i.id === itemId);
        if (index === -1) {
            throw new types_1.BusinessRuleViolationError(`Project item not found: ${itemId}`);
        }
        const item = this._items[index];
        this._items.splice(index, 1);
        this.touch();
        this.addDomainEvent(new project_events_1.ProjectItemRemovedEvent(this.id, item.id, item.materialId, item.quantity));
    }
    /**
     * Update project status with valid transitions.
     */
    updateStatus(newStatus) {
        const validTransitions = {
            [project_enums_1.ProjectStatus.DRAFT]: [project_enums_1.ProjectStatus.ACTIVE, project_enums_1.ProjectStatus.CANCELLED],
            [project_enums_1.ProjectStatus.ACTIVE]: [project_enums_1.ProjectStatus.IN_PROGRESS, project_enums_1.ProjectStatus.CANCELLED],
            [project_enums_1.ProjectStatus.IN_PROGRESS]: [project_enums_1.ProjectStatus.COMPLETED, project_enums_1.ProjectStatus.CANCELLED],
            [project_enums_1.ProjectStatus.COMPLETED]: [],
            [project_enums_1.ProjectStatus.CANCELLED]: [],
        };
        if (!validTransitions[this._status].includes(newStatus)) {
            throw new types_1.BusinessRuleViolationError(`Invalid status transition: ${this._status} → ${newStatus}`);
        }
        const oldStatus = this._status;
        this._status = newStatus;
        if (newStatus === project_enums_1.ProjectStatus.COMPLETED) {
            this._endDate = new Date();
        }
        this.touch();
        this.addDomainEvent(new project_events_1.ProjectStatusChangedEvent(this.id, oldStatus, newStatus));
    }
    /**
     * Update project info.
     */
    updateInfo(params) {
        if (params.name !== undefined) {
            if (!params.name || params.name.trim().length === 0) {
                throw new types_1.BusinessRuleViolationError('Project name cannot be empty');
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
exports.Project = Project;
//# sourceMappingURL=project.entity.js.map
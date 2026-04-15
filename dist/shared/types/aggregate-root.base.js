"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateRoot = void 0;
const entity_base_1 = require("./entity.base");
/**
 * Base class for Aggregate Roots.
 * Aggregates are the consistency boundaries in DDD.
 * They collect domain events that occurred within them.
 */
class AggregateRoot extends entity_base_1.Entity {
    _domainEvents = [];
    constructor(id, createdAt, updatedAt) {
        super(id, createdAt, updatedAt);
    }
    get domainEvents() {
        return [...this._domainEvents];
    }
    /**
     * Add a domain event to this aggregate.
     */
    addDomainEvent(event) {
        this._domainEvents.push(event);
    }
    /**
     * Clear all domain events (typically after persistence).
     */
    clearEvents() {
        this._domainEvents = [];
    }
    /**
     * Mark entity as updated.
     */
    touch() {
        this.updatedAt = new Date();
    }
}
exports.AggregateRoot = AggregateRoot;
//# sourceMappingURL=aggregate-root.base.js.map
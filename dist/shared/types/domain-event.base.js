"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = exports.DomainEvent = void 0;
/**
 * Base class for Domain Events.
 */
class DomainEvent {
    eventName;
    occurredOn;
    aggregateId;
    constructor(aggregateId, eventName) {
        this.occurredOn = new Date();
        this.aggregateId = aggregateId;
        this.eventName = eventName;
    }
}
exports.DomainEvent = DomainEvent;
/**
 * Simple in-memory event bus for domain events.
 */
class EventBus {
    handlers = new Map();
    register(eventName, handler) {
        const existing = this.handlers.get(eventName) ?? [];
        existing.push(handler);
        this.handlers.set(eventName, existing);
    }
    async publish(event) {
        const handlers = this.handlers.get(event.eventName) ?? [];
        await Promise.all(handlers.map(h => h.handle(event)));
    }
    async publishAll(events) {
        for (const event of events) {
            await this.publish(event);
        }
    }
}
exports.EventBus = EventBus;
//# sourceMappingURL=domain-event.base.js.map
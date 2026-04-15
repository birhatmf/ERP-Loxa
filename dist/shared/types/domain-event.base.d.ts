/**
 * Domain Event interface.
 * Events represent something that happened in the domain.
 */
export interface IDomainEvent {
    readonly eventName: string;
    readonly occurredOn: Date;
    readonly aggregateId: string;
}
/**
 * Base class for Domain Events.
 */
export declare abstract class DomainEvent implements IDomainEvent {
    readonly eventName: string;
    readonly occurredOn: Date;
    readonly aggregateId: string;
    protected constructor(aggregateId: string, eventName: string);
}
/**
 * Domain Event handler interface.
 */
export interface IDomainEventHandler<T extends DomainEvent> {
    handle(event: T): Promise<void>;
}
/**
 * Simple in-memory event bus for domain events.
 */
export declare class EventBus {
    private handlers;
    register<T extends DomainEvent>(eventName: string, handler: IDomainEventHandler<T>): void;
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
}
//# sourceMappingURL=domain-event.base.d.ts.map
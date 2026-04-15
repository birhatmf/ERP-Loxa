import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';
/**
 * Base class for Aggregate Roots.
 * Aggregates are the consistency boundaries in DDD.
 * They collect domain events that occurred within them.
 */
export declare abstract class AggregateRoot<TId extends string = string> extends Entity<TId> {
    private _domainEvents;
    protected constructor(id: TId, createdAt?: Date, updatedAt?: Date);
    get domainEvents(): DomainEvent[];
    /**
     * Add a domain event to this aggregate.
     */
    protected addDomainEvent(event: DomainEvent): void;
    /**
     * Clear all domain events (typically after persistence).
     */
    clearEvents(): void;
    /**
     * Mark entity as updated.
     */
    protected touch(): void;
}
//# sourceMappingURL=aggregate-root.base.d.ts.map
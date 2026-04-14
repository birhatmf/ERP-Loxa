import { Entity } from './entity.base';
import { DomainEvent } from './domain-event.base';

/**
 * Base class for Aggregate Roots.
 * Aggregates are the consistency boundaries in DDD.
 * They collect domain events that occurred within them.
 */
export abstract class AggregateRoot<TId extends string = string> extends Entity<TId> {
  private _domainEvents: DomainEvent[] = [];

  protected constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    super(id, createdAt, updatedAt);
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Add a domain event to this aggregate.
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear all domain events (typically after persistence).
   */
  clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Mark entity as updated.
   */
  protected touch(): void {
    this.updatedAt = new Date();
  }
}

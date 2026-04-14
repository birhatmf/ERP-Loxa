import { Entity } from './entity.base';

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
export abstract class DomainEvent implements IDomainEvent {
  public readonly eventName: string;
  public readonly occurredOn: Date;
  public readonly aggregateId: string;

  protected constructor(aggregateId: string, eventName: string) {
    this.occurredOn = new Date();
    this.aggregateId = aggregateId;
    this.eventName = eventName;
  }
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
export class EventBus {
  private handlers: Map<string, IDomainEventHandler<DomainEvent>[]> = new Map();

  register<T extends DomainEvent>(eventName: string, handler: IDomainEventHandler<T>): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler as IDomainEventHandler<DomainEvent>);
    this.handlers.set(eventName, existing);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventName) ?? [];
    await Promise.all(handlers.map(h => h.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

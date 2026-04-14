import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for all entities in the system.
 * Entities have identity and lifecycle.
 */
export abstract class Entity<TId extends string = string> {
  public readonly id: TId;
  public readonly createdAt: Date;
  public updatedAt: Date;

  protected constructor(id: TId, createdAt?: Date, updatedAt?: Date) {
    this.id = id;
    this.createdAt = createdAt ?? new Date();
    this.updatedAt = updatedAt ?? this.createdAt;
  }

  equals(other: Entity<TId>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof Entity)) return false;
    return this.id === other.id;
  }
}

/**
 * Generate a new UUID for entity creation.
 */
export function generateId<T extends string = string>(): T {
  return uuidv4() as T;
}

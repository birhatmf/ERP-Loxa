/**
 * Base class for all entities in the system.
 * Entities have identity and lifecycle.
 */
export declare abstract class Entity<TId extends string = string> {
    readonly id: TId;
    readonly createdAt: Date;
    updatedAt: Date;
    protected constructor(id: TId, createdAt?: Date, updatedAt?: Date);
    equals(other: Entity<TId>): boolean;
}
/**
 * Generate a new UUID for entity creation.
 */
export declare function generateId<T extends string = string>(): T;
//# sourceMappingURL=entity.base.d.ts.map
/**
 * Base class for Value Objects.
 * Value Objects are immutable and compared by value, not identity.
 */
export declare abstract class ValueObject<T> {
    readonly props: T;
    protected constructor(props: T);
    equals(other: ValueObject<T>): boolean;
}
//# sourceMappingURL=value-object.base.d.ts.map
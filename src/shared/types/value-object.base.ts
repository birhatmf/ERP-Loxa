/**
 * Base class for Value Objects.
 * Value Objects are immutable and compared by value, not identity.
 */
export abstract class ValueObject<T> {
  public readonly props: T;

  protected constructor(props: T) {
    this.props = Object.freeze(props);
  }

  equals(other: ValueObject<T>): boolean {
    if (other === null || other === undefined) return false;
    if (!(other instanceof ValueObject)) return false;
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueObject = void 0;
/**
 * Base class for Value Objects.
 * Value Objects are immutable and compared by value, not identity.
 */
class ValueObject {
    props;
    constructor(props) {
        this.props = Object.freeze(props);
    }
    equals(other) {
        if (other === null || other === undefined)
            return false;
        if (!(other instanceof ValueObject))
            return false;
        return JSON.stringify(this.props) === JSON.stringify(other.props);
    }
}
exports.ValueObject = ValueObject;
//# sourceMappingURL=value-object.base.js.map
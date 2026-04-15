"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
exports.generateId = generateId;
const uuid_1 = require("uuid");
/**
 * Base class for all entities in the system.
 * Entities have identity and lifecycle.
 */
class Entity {
    id;
    createdAt;
    updatedAt;
    constructor(id, createdAt, updatedAt) {
        this.id = id;
        this.createdAt = createdAt ?? new Date();
        this.updatedAt = updatedAt ?? this.createdAt;
    }
    equals(other) {
        if (other === null || other === undefined)
            return false;
        if (!(other instanceof Entity))
            return false;
        return this.id === other.id;
    }
}
exports.Entity = Entity;
/**
 * Generate a new UUID for entity creation.
 */
function generateId() {
    return (0, uuid_1.v4)();
}
//# sourceMappingURL=entity.base.js.map
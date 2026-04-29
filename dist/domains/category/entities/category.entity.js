"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Category = void 0;
const types_1 = require("../../../shared/types");
class Category extends types_1.AggregateRoot {
    _name;
    _type;
    _color;
    _icon;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._name = props.name;
        this._type = props.type;
        this._color = props.color;
        this._icon = props.icon;
    }
    static create(params) {
        const now = new Date();
        return new Category({
            id: (0, types_1.generateId)(),
            name: params.name,
            type: params.type,
            color: params.color ?? '#6366f1',
            icon: params.icon ?? '',
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new Category(props);
    }
    get name() { return this._name; }
    get type() { return this._type; }
    get color() { return this._color; }
    get icon() { return this._icon; }
    updateInfo(params) {
        if (params.name !== undefined)
            this._name = params.name;
        if (params.type !== undefined)
            this._type = params.type;
        if (params.color !== undefined)
            this._color = params.color;
        if (params.icon !== undefined)
            this._icon = params.icon;
        this.touch();
    }
    toSafeObject() {
        return {
            id: this.id,
            name: this._name,
            type: this._type,
            color: this._color,
            icon: this._icon,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.Category = Category;
//# sourceMappingURL=category.entity.js.map
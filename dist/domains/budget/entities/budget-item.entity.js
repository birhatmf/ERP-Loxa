"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BudgetItem = void 0;
const types_1 = require("../../../shared/types");
class BudgetItem extends types_1.AggregateRoot {
    _category;
    _type;
    _planned;
    _period;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._category = props.category;
        this._type = props.type;
        this._planned = props.planned;
        this._period = props.period;
    }
    static create(params) {
        const now = new Date();
        const period = params.period ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        return new BudgetItem({
            id: (0, types_1.generateId)(),
            category: params.category,
            type: params.type,
            planned: types_1.Money.create(params.planned),
            period,
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new BudgetItem(props);
    }
    get category() { return this._category; }
    get type() { return this._type; }
    get planned() { return this._planned; }
    get period() { return this._period; }
    updateInfo(params) {
        if (params.category !== undefined)
            this._category = params.category;
        if (params.type !== undefined)
            this._type = params.type;
        if (params.planned !== undefined)
            this._planned = types_1.Money.create(params.planned);
        if (params.period !== undefined)
            this._period = params.period;
        this.touch();
    }
    toSafeObject() {
        return {
            id: this.id,
            category: this._category,
            type: this._type,
            planned: this._planned.amount,
            period: this._period,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.BudgetItem = BudgetItem;
//# sourceMappingURL=budget-item.entity.js.map
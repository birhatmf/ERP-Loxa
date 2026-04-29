"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Customer = void 0;
const types_1 = require("../../../shared/types");
class Customer extends types_1.AggregateRoot {
    _name;
    _phone;
    _email;
    _address;
    _taxId;
    _notes;
    _totalPurchases;
    _outstandingBalance;
    constructor(props) {
        super(props.id, props.createdAt, props.updatedAt);
        this._name = props.name;
        this._phone = props.phone;
        this._email = props.email;
        this._address = props.address;
        this._taxId = props.taxId;
        this._notes = props.notes;
        this._totalPurchases = props.totalPurchases;
        this._outstandingBalance = props.outstandingBalance;
    }
    static create(params) {
        const now = new Date();
        return new Customer({
            id: (0, types_1.generateId)(),
            name: params.name,
            phone: params.phone ?? '',
            email: params.email ?? '',
            address: params.address ?? '',
            taxId: params.taxId ?? '',
            notes: params.notes ?? '',
            totalPurchases: types_1.Money.create(0),
            outstandingBalance: types_1.Money.create(0),
            createdAt: now,
            updatedAt: now,
        });
    }
    static reconstitute(props) {
        return new Customer(props);
    }
    get name() { return this._name; }
    get phone() { return this._phone; }
    get email() { return this._email; }
    get address() { return this._address; }
    get taxId() { return this._taxId; }
    get notes() { return this._notes; }
    get totalPurchases() { return this._totalPurchases; }
    get outstandingBalance() { return this._outstandingBalance; }
    updateInfo(params) {
        if (params.name !== undefined)
            this._name = params.name;
        if (params.phone !== undefined)
            this._phone = params.phone;
        if (params.email !== undefined)
            this._email = params.email;
        if (params.address !== undefined)
            this._address = params.address;
        if (params.taxId !== undefined)
            this._taxId = params.taxId;
        if (params.notes !== undefined)
            this._notes = params.notes;
        this.touch();
    }
    addPurchase(amount) {
        this._totalPurchases = this._totalPurchases.add(amount);
        this.touch();
    }
    updateOutstandingBalance(amount) {
        this._outstandingBalance = amount;
        this.touch();
    }
    toSafeObject() {
        return {
            id: this.id,
            name: this._name,
            phone: this._phone,
            email: this._email,
            address: this._address,
            taxId: this._taxId,
            notes: this._notes,
            totalPurchases: this._totalPurchases.amount,
            outstandingBalance: this._outstandingBalance.amount,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.Customer = Customer;
//# sourceMappingURL=customer.entity.js.map
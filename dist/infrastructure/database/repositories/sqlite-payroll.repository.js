"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlitePayrollRepository = void 0;
const types_1 = require("../../../shared/types");
class SqlitePayrollRepository {
    knex;
    constructor(knex) {
        this.knex = knex;
    }
    async findWorkers() {
        const rows = await this.knex('workers').orderBy('name', 'asc');
        return rows.map((row) => this.toWorker(row));
    }
    async findWorkerById(id) {
        const row = await this.knex('workers').where({ id }).first();
        return row ? this.toWorker(row) : null;
    }
    async saveWorker(params) {
        const now = new Date();
        const id = params.id ?? (0, types_1.generateId)();
        const existing = await this.knex('workers').where({ id }).first();
        const row = {
            id,
            name: params.name.trim(),
            monthly_salary: params.monthlySalary,
            is_active: params.isActive === false ? 0 : 1,
            created_at: existing?.created_at ?? now.toISOString(),
            updated_at: now.toISOString(),
        };
        if (existing) {
            await this.knex('workers').where({ id }).update(row);
        }
        else {
            await this.knex('workers').insert(row);
        }
        return (await this.findWorkerById(id));
    }
    async setWorkerActive(id, isActive) {
        await this.knex('workers').where({ id }).update({
            is_active: isActive ? 1 : 0,
            updated_at: new Date().toISOString(),
        });
    }
    async upsertSalaryMonth(workerId, period, salary) {
        const now = new Date();
        const existing = await this.knex('worker_salary_months').where({ worker_id: workerId, period }).first();
        const id = existing?.id ?? (0, types_1.generateId)();
        const row = {
            id,
            worker_id: workerId,
            period,
            salary,
            created_at: existing?.created_at ?? now.toISOString(),
            updated_at: now.toISOString(),
        };
        if (existing) {
            await this.knex('worker_salary_months').where({ id }).update(row);
        }
        else {
            await this.knex('worker_salary_months').insert(row);
        }
        return this.toSalaryMonth((await this.knex('worker_salary_months').where({ id }).first()));
    }
    async findSalaryMonths(period) {
        const rows = await this.knex('worker_salary_months').where({ period });
        return rows.map((row) => this.toSalaryMonth(row));
    }
    async addAdvance(params) {
        const now = new Date();
        const id = (0, types_1.generateId)();
        await this.knex('worker_advances').insert({
            id,
            worker_id: params.workerId,
            period: params.period,
            amount: params.amount,
            paid_at: params.paidAt.toISOString(),
            note: params.note ?? '',
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
        });
        return this.toAdvance((await this.knex('worker_advances').where({ id }).first()));
    }
    async findAdvancesByPeriod(period) {
        const rows = await this.knex('worker_advances').where({ period }).orderBy('paid_at', 'desc');
        return rows.map((row) => this.toAdvance(row));
    }
    async deleteAdvance(id) {
        await this.knex('worker_advances').where({ id }).delete();
    }
    toWorker(row) {
        return {
            id: row.id,
            name: row.name,
            monthlySalary: Number(row.monthly_salary),
            isActive: Boolean(row.is_active),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
    toSalaryMonth(row) {
        return {
            id: row.id,
            workerId: row.worker_id,
            period: row.period,
            salary: Number(row.salary),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
    toAdvance(row) {
        return {
            id: row.id,
            workerId: row.worker_id,
            period: row.period,
            amount: Number(row.amount),
            paidAt: new Date(row.paid_at),
            note: row.note ?? '',
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
}
exports.SqlitePayrollRepository = SqlitePayrollRepository;
//# sourceMappingURL=sqlite-payroll.repository.js.map
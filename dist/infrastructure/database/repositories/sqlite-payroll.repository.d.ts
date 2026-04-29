import { Knex } from 'knex';
export interface WorkerRecord {
    id: string;
    name: string;
    monthlySalary: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkerAdvanceRecord {
    id: string;
    workerId: string;
    period: string;
    amount: number;
    paidAt: Date;
    note: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkerSalaryMonthRecord {
    id: string;
    workerId: string;
    period: string;
    salary: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class SqlitePayrollRepository {
    private knex;
    constructor(knex: Knex);
    findWorkers(): Promise<WorkerRecord[]>;
    findWorkerById(id: string): Promise<WorkerRecord | null>;
    saveWorker(params: {
        id?: string;
        name: string;
        monthlySalary: number;
        isActive?: boolean;
    }): Promise<WorkerRecord>;
    setWorkerActive(id: string, isActive: boolean): Promise<void>;
    upsertSalaryMonth(workerId: string, period: string, salary: number): Promise<WorkerSalaryMonthRecord>;
    findSalaryMonths(period: string): Promise<WorkerSalaryMonthRecord[]>;
    addAdvance(params: {
        workerId: string;
        period: string;
        amount: number;
        paidAt: Date;
        note?: string;
    }): Promise<WorkerAdvanceRecord>;
    findAdvancesByPeriod(period: string): Promise<WorkerAdvanceRecord[]>;
    deleteAdvance(id: string): Promise<void>;
    private toWorker;
    private toSalaryMonth;
    private toAdvance;
}
//# sourceMappingURL=sqlite-payroll.repository.d.ts.map
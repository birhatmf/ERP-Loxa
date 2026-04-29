import { Knex } from 'knex';
import { generateId } from '@shared/types';

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

export class SqlitePayrollRepository {
  constructor(private knex: Knex) {}

  async findWorkers(): Promise<WorkerRecord[]> {
    const rows = await this.knex('workers').orderBy('name', 'asc');
    return rows.map((row: any) => this.toWorker(row));
  }

  async findWorkerById(id: string): Promise<WorkerRecord | null> {
    const row = await this.knex('workers').where({ id }).first();
    return row ? this.toWorker(row) : null;
  }

  async saveWorker(params: {
    id?: string;
    name: string;
    monthlySalary: number;
    isActive?: boolean;
  }): Promise<WorkerRecord> {
    const now = new Date();
    const id = params.id ?? generateId();
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
    } else {
      await this.knex('workers').insert(row);
    }

    return (await this.findWorkerById(id))!;
  }

  async setWorkerActive(id: string, isActive: boolean): Promise<void> {
    await this.knex('workers').where({ id }).update({
      is_active: isActive ? 1 : 0,
      updated_at: new Date().toISOString(),
    });
  }

  async upsertSalaryMonth(workerId: string, period: string, salary: number): Promise<WorkerSalaryMonthRecord> {
    const now = new Date();
    const existing = await this.knex('worker_salary_months').where({ worker_id: workerId, period }).first();
    const id = existing?.id ?? generateId();
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
    } else {
      await this.knex('worker_salary_months').insert(row);
    }

    return this.toSalaryMonth((await this.knex('worker_salary_months').where({ id }).first())!);
  }

  async findSalaryMonths(period: string): Promise<WorkerSalaryMonthRecord[]> {
    const rows = await this.knex('worker_salary_months').where({ period });
    return rows.map((row: any) => this.toSalaryMonth(row));
  }

  async addAdvance(params: {
    workerId: string;
    period: string;
    amount: number;
    paidAt: Date;
    note?: string;
  }): Promise<WorkerAdvanceRecord> {
    const now = new Date();
    const id = generateId();
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
    return this.toAdvance((await this.knex('worker_advances').where({ id }).first())!);
  }

  async findAdvancesByPeriod(period: string): Promise<WorkerAdvanceRecord[]> {
    const rows = await this.knex('worker_advances').where({ period }).orderBy('paid_at', 'desc');
    return rows.map((row: any) => this.toAdvance(row));
  }

  async deleteAdvance(id: string): Promise<void> {
    await this.knex('worker_advances').where({ id }).delete();
  }

  private toWorker(row: any): WorkerRecord {
    return {
      id: row.id,
      name: row.name,
      monthlySalary: Number(row.monthly_salary),
      isActive: Boolean(row.is_active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toSalaryMonth(row: any): WorkerSalaryMonthRecord {
    return {
      id: row.id,
      workerId: row.worker_id,
      period: row.period,
      salary: Number(row.salary),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private toAdvance(row: any): WorkerAdvanceRecord {
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

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import knex, { Knex } from 'knex';
import { up } from '../migrations/001_initial_schema';
import { up as createAuditLogs } from '../migrations/002_add_audit_logs_table';
import { SqliteAuditLogRepository } from './sqlite-audit-log.repository';

describe('SqliteAuditLogRepository', () => {
  let db: Knex;

  beforeAll(async () => {
    db = knex({
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    });
    await up(db);
    await createAuditLogs(db);
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('persists and reads audit logs', async () => {
    const repo = new SqliteAuditLogRepository(db);

    await repo.save({
      kind: 'domain_action',
      action: 'project.cost.calculated',
      message: 'Project cost calculated',
      entityType: 'project',
      entityId: 'project-1',
      metadata: { totalCost: 123.45 },
    });

    const rows = await repo.findAll();

    expect(rows).toHaveLength(1);
    expect(rows[0].kind).toBe('domain_action');
    expect(rows[0].entityId).toBe('project-1');
    expect(rows[0].metadata).toEqual({ totalCost: 123.45 });
  });
});

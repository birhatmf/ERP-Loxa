import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import knex from 'knex';
import { up as createInitialSchema } from '../migrations/001_initial_schema';
import { up as createProjectFilesTable } from '../migrations/005_add_project_files_table';
import { SqliteProjectFileRepository } from './sqlite-project-file.repository';

describe('SqliteProjectFileRepository', () => {
  let dbDir = '';
  let dbFile = '';

  afterEach(() => {
    if (dbDir && fs.existsSync(dbDir)) {
      fs.rmSync(dbDir, { recursive: true, force: true });
    }
  });

  it('persists, lists and deletes project files', async () => {
    dbDir = fs.mkdtempSync(path.join(os.tmpdir(), 'erp-project-files-'));
    dbFile = path.join(dbDir, 'db.sqlite');
    const connection = knex({
      client: 'better-sqlite3',
      connection: { filename: dbFile },
      useNullAsDefault: true,
    });

    try {
      await createInitialSchema(connection);
      await createProjectFilesTable(connection);

      await connection('projects').insert({
        id: 'project-1',
        name: 'Demo Project',
        customer_name: 'ACME',
        description: '',
        start_date: new Date().toISOString(),
        end_date: null,
        status: 'draft',
        total_price: 1000,
        total_price_currency: 'TRY',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      const repo = new SqliteProjectFileRepository(connection);
      const filePath = path.join(dbDir, 'doc.pdf');
      fs.writeFileSync(filePath, 'demo');

      const now = new Date();
      await repo.save({
        id: 'file-1',
        projectId: 'project-1',
        name: 'doc.pdf',
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
        size: 4,
        storagePath: filePath,
        uploadedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      expect(await repo.findById('file-1')).toMatchObject({
        id: 'file-1',
        projectId: 'project-1',
        name: 'doc.pdf',
        originalName: 'doc.pdf',
        mimeType: 'application/pdf',
        size: 4,
        storagePath: filePath,
      });

      expect(await repo.findByProjectId('project-1')).toHaveLength(1);

      await repo.delete('file-1');
      expect(await repo.findById('file-1')).toBeNull();
    } finally {
      await connection.destroy();
    }
  });
});

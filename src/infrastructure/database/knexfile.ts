import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'data', 'erp.db');

class CustomMigrationSource {
  async getMigrations() {
    const ext = path.extname(__filename); // .ts or .js
    const dir = path.join(__dirname, 'migrations');
    return fs.readdirSync(dir)
      .filter((file) => file.endsWith(ext))
      .sort();
  }

  getMigrationName(migration: string) {
    // Always use .ts as the name in the database for consistency
    return migration.replace(/\.js$/, '.ts');
  }

  getMigration(migration: string) {
    return require(path.join(__dirname, 'migrations', migration));
  }
}

export const knexConfig: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  migrations: {
    migrationSource: new CustomMigrationSource(),
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
  },
};

export function createConnection(): Knex {
  return knex(knexConfig);
}

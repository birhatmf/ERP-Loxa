import knex, { Knex } from 'knex';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'erp.db');

export const knexConfig: Knex.Config = {
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.join(__dirname, 'migrations'),
  },
  seeds: {
    directory: path.join(__dirname, 'seeds'),
  },
};

export function createConnection(): Knex {
  return knex(knexConfig);
}

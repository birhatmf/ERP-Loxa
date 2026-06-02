import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('receivables', (table) => {
    table.string('id').primary();
    table.string('title').notNullable();
    table.string('description').nullable();
    table.decimal('amount', 12, 2).notNullable();
    table.string('currency').defaultTo('TRY');
    table.date('due_date').notNullable();
    table.string('status').notNullable().defaultTo('pending'); // pending, collected
    table.string('debtor').notNullable(); 
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('receivables');
}

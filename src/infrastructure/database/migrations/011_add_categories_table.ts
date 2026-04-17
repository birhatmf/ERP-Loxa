import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Categories table
  await knex.schema.createTable('categories', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('type').notNullable(); // income, expense, project, material
    table.string('color').notNullable().defaultTo('#6366f1');
    table.string('icon').notNullable().defaultTo('');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('categories');
}

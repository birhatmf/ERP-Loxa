import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Budget items table
  await knex.schema.createTable('budget_items', (table) => {
    table.string('id').primary();
    table.string('category').notNullable();
    table.string('type').notNullable(); // income, expense
    table.decimal('planned', 15, 2).notNullable();
    table.string('period').notNullable(); // YYYY-MM format
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('budget_items');
}

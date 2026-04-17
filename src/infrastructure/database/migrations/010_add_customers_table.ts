import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Customers table
  await knex.schema.createTable('customers', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('phone').notNullable().defaultTo('');
    table.string('email').notNullable().defaultTo('');
    table.string('address').notNullable().defaultTo('');
    table.string('tax_id').notNullable().defaultTo('');
    table.text('notes').notNullable().defaultTo('');
    table.decimal('total_purchases', 15, 2).notNullable().defaultTo(0);
    table.decimal('outstanding_balance', 15, 2).notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('customers');
}

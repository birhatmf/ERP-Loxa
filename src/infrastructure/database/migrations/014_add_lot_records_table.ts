import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Lot records table
  await knex.schema.createTable('lot_records', (table) => {
    table.string('id').primary();
    table.string('material_id').nullable();
    table.string('lot_number').notNullable();
    table.string('serial_number').nullable();
    table.decimal('quantity', 15, 4).notNullable();
    table.string('supplier_id').nullable();
    table.timestamp('received_date').notNullable();
    table.timestamp('expiry_date').nullable();
    table.text('notes').notNullable().defaultTo('');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('lot_records');
}

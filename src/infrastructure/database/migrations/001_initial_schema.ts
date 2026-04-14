import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Materials table
  await knex.schema.createTable('materials', (table) => {
    table.string('id').primary();
    table.string('name').notNullable().unique();
    table.string('unit').notNullable();
    table.decimal('current_stock', 15, 4).notNullable().defaultTo(0);
    table.decimal('min_stock_level', 15, 4).notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Stock movements table
  await knex.schema.createTable('stock_movements', (table) => {
    table.string('id').primary();
    table.string('material_id').notNullable().references('id').inTable('materials');
    table.string('type').notNullable(); // IN / OUT
    table.decimal('quantity', 15, 4).notNullable();
    table.text('description').notNullable();
    table.string('related_project_id').nullable();
    table.timestamp('date').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Transactions table
  await knex.schema.createTable('transactions', (table) => {
    table.string('id').primary();
    table.decimal('amount', 15, 2).notNullable();
    table.string('amount_currency', 3).notNullable().defaultTo('TRY');
    table.decimal('vat_amount', 15, 2).notNullable().defaultTo(0);
    table.string('vat_currency', 3).notNullable().defaultTo('TRY');
    table.string('type').notNullable(); // income / expense
    table.string('payment_method').notNullable(); // nakit / havale / kart
    table.boolean('is_invoiced').notNullable().defaultTo(false);
    table.text('description').notNullable();
    table.string('created_by').notNullable();
    table.string('related_project_id').nullable();
    table.string('status').notNullable().defaultTo('active');
    table.text('cancellation_reason').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Projects table
  await knex.schema.createTable('projects', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('customer_name').notNullable();
    table.text('description').notNullable().defaultTo('');
    table.timestamp('start_date').notNullable();
    table.timestamp('end_date').nullable();
    table.string('status').notNullable().defaultTo('draft');
    table.decimal('total_price', 15, 2).notNullable();
    table.string('total_price_currency', 3).notNullable().defaultTo('TRY');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Project items table
  await knex.schema.createTable('project_items', (table) => {
    table.string('id').primary();
    table.string('project_id').notNullable().references('id').inTable('projects');
    table.string('material_id').notNullable().references('id').inTable('materials');
    table.decimal('quantity', 15, 4).notNullable();
    table.decimal('unit_price', 15, 2).notNullable();
    table.string('unit_price_currency', 3).notNullable().defaultTo('TRY');
    table.decimal('total_price', 15, 2).notNullable();
    table.string('total_price_currency', 3).notNullable().defaultTo('TRY');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Checks table
  await knex.schema.createTable('checks', (table) => {
    table.string('id').primary();
    table.string('type').notNullable(); // received / given
    table.decimal('amount', 15, 2).notNullable();
    table.string('amount_currency', 3).notNullable().defaultTo('TRY');
    table.timestamp('due_date').notNullable();
    table.string('owner_name').notNullable();
    table.string('check_number').nullable();
    table.string('bank_name').nullable();
    table.text('description').notNullable().defaultTo('');
    table.string('status').notNullable().defaultTo('pending');
    table.timestamp('paid_date').nullable();
    table.string('related_project_id').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Invoices table
  await knex.schema.createTable('invoices', (table) => {
    table.string('id').primary();
    table.string('invoice_number').notNullable().unique();
    table.string('project_id').nullable().references('id').inTable('projects');
    table.string('customer_id').nullable();
    table.string('customer_name').notNullable();
    table.text('customer_address').nullable();
    table.decimal('subtotal', 15, 2).notNullable();
    table.string('subtotal_currency', 3).notNullable().defaultTo('TRY');
    table.decimal('total_vat', 15, 2).notNullable();
    table.string('total_vat_currency', 3).notNullable().defaultTo('TRY');
    table.decimal('total_amount', 15, 2).notNullable();
    table.string('total_amount_currency', 3).notNullable().defaultTo('TRY');
    table.timestamp('due_date').notNullable();
    table.string('status').notNullable().defaultTo('draft');
    table.timestamp('paid_date').nullable();
    table.text('notes').nullable();
    table.string('created_by').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Invoice items table
  await knex.schema.createTable('invoice_items', (table) => {
    table.string('id').primary();
    table.string('invoice_id').notNullable().references('id').inTable('invoices');
    table.text('description').notNullable();
    table.decimal('quantity', 15, 4).notNullable();
    table.decimal('unit_price', 15, 2).notNullable();
    table.string('unit_price_currency', 3).notNullable().defaultTo('TRY');
    table.decimal('vat_rate', 5, 2).notNullable().defaultTo(18);
    table.decimal('total_price', 15, 2).notNullable();
    table.string('total_price_currency', 3).notNullable().defaultTo('TRY');
    table.decimal('vat_amount', 15, 2).notNullable();
    table.string('vat_amount_currency', 3).notNullable().defaultTo('TRY');
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  // Users table
  await knex.schema.createTable('users', (table) => {
    table.string('id').primary();
    table.string('username').notNullable().unique();
    table.string('password_hash').notNullable();
    table.string('name').notNullable();
    table.string('role').notNullable().defaultTo('user');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('last_login').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('invoice_items');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('checks');
  await knex.schema.dropTableIfExists('project_items');
  await knex.schema.dropTableIfExists('projects');
  await knex.schema.dropTableIfExists('transactions');
  await knex.schema.dropTableIfExists('stock_movements');
  await knex.schema.dropTableIfExists('materials');
}

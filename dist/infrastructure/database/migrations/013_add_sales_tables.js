"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    // Sales table
    await knex.schema.createTable('sales', (table) => {
        table.string('id').primary();
        table.string('customer_name').notNullable();
        table.string('customer_phone').notNullable().defaultTo('');
        table.string('customer_address').notNullable().defaultTo('');
        table.decimal('total_amount', 15, 2).notNullable();
        table.string('payment_status').notNullable().defaultTo('bekliyor'); // bekliyor, kısmi, ödendi
        table.string('payment_method').notNullable().defaultTo('nakit');
        table.string('payment_note').notNullable().defaultTo('');
        table.text('description').notNullable().defaultTo('');
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
    // Sale items table
    await knex.schema.createTable('sale_items', (table) => {
        table.string('id').primary();
        table.string('sale_id').notNullable().references('id').inTable('sales').onDelete('cascade');
        table.string('description').notNullable();
        table.decimal('quantity', 15, 4).notNullable();
        table.decimal('unit_price', 15, 2).notNullable();
        table.decimal('total_price', 15, 2).notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('sale_items');
    await knex.schema.dropTableIfExists('sales');
}
//# sourceMappingURL=013_add_sales_tables.js.map
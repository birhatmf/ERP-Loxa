"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const suppliersExists = await knex.schema.hasTable('suppliers');
    if (!suppliersExists) {
        await knex.schema.createTable('suppliers', (table) => {
            table.string('id').primary();
            table.string('name').notNullable();
            table.string('contact_person').notNullable().defaultTo('');
            table.string('phone').notNullable().defaultTo('');
            table.string('email').notNullable().defaultTo('');
            table.text('address').notNullable().defaultTo('');
            table.string('tax_id').notNullable().defaultTo('');
            table.text('notes').notNullable().defaultTo('');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        });
    }
    const ordersExists = await knex.schema.hasTable('purchase_orders');
    if (!ordersExists) {
        await knex.schema.createTable('purchase_orders', (table) => {
            table.string('id').primary();
            table.string('supplier_id').notNullable().references('id').inTable('suppliers').onDelete('RESTRICT');
            table.string('supplier_name').notNullable();
            table.string('status').notNullable().defaultTo('draft');
            table.timestamp('expected_date').nullable();
            table.timestamp('received_date').nullable();
            table.decimal('total_amount', 15, 2).notNullable().defaultTo(0);
            table.text('description').notNullable().defaultTo('');
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        });
    }
    const itemsExists = await knex.schema.hasTable('purchase_order_items');
    if (!itemsExists) {
        await knex.schema.createTable('purchase_order_items', (table) => {
            table.string('id').primary();
            table.string('purchase_order_id').notNullable().references('id').inTable('purchase_orders').onDelete('CASCADE');
            table.string('material_id').notNullable().references('id').inTable('materials').onDelete('RESTRICT');
            table.string('material_name').notNullable();
            table.decimal('quantity', 15, 4).notNullable();
            table.decimal('unit_price', 15, 2).notNullable();
            table.decimal('received_qty', 15, 4).notNullable().defaultTo(0);
            table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
            table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        });
    }
}
async function down(knex) {
    await knex.schema.dropTableIfExists('purchase_order_items');
    await knex.schema.dropTableIfExists('purchase_orders');
    await knex.schema.dropTableIfExists('suppliers');
}
//# sourceMappingURL=006_add_suppliers_and_purchase_orders_tables.js.map
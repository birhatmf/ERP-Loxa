"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    await knex.schema.dropTableIfExists('lot_records');
}
//# sourceMappingURL=014_add_lot_records_table.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    await knex.schema.dropTableIfExists('customers');
}
//# sourceMappingURL=010_add_customers_table.js.map
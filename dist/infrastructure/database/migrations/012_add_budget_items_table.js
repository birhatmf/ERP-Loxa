"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    await knex.schema.dropTableIfExists('budget_items');
}
//# sourceMappingURL=012_add_budget_items_table.js.map
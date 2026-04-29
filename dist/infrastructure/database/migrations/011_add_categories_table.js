"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
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
async function down(knex) {
    await knex.schema.dropTableIfExists('categories');
}
//# sourceMappingURL=011_add_categories_table.js.map
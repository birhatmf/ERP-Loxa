"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    await knex.schema.createTable('check_files', (table) => {
        table.string('id').primary();
        table.string('check_id').notNullable().references('id').inTable('checks').onDelete('CASCADE');
        table.string('name').notNullable();
        table.string('original_name').notNullable();
        table.string('mime_type').notNullable();
        table.integer('size').notNullable();
        table.text('storage_path').notNullable();
        table.timestamp('uploaded_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        table.index(['check_id']);
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('check_files');
}
//# sourceMappingURL=009_add_check_files_table.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const exists = await knex.schema.hasTable('project_files');
    if (exists)
        return;
    await knex.schema.createTable('project_files', (table) => {
        table.string('id').primary();
        table.string('project_id').notNullable().references('id').inTable('projects').onDelete('CASCADE');
        table.string('name').notNullable();
        table.string('original_name').notNullable();
        table.string('mime_type').notNullable();
        table.integer('size').notNullable();
        table.text('storage_path').notNullable();
        table.timestamp('uploaded_at').notNullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('project_files');
}
//# sourceMappingURL=005_add_project_files_table.js.map
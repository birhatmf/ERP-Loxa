"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const exists = await knex.schema.hasTable('audit_logs');
    if (exists)
        return;
    await knex.schema.createTable('audit_logs', (table) => {
        table.string('id').primary();
        table.string('kind').notNullable();
        table.string('action').notNullable();
        table.text('message').notNullable();
        table.string('user_id').nullable();
        table.string('entity_type').nullable();
        table.string('entity_id').nullable();
        table.string('method').nullable();
        table.text('path').nullable();
        table.integer('status_code').nullable();
        table.integer('duration_ms').nullable();
        table.string('ip').nullable();
        table.text('metadata_json').nullable();
        table.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('audit_logs');
}
//# sourceMappingURL=002_add_audit_logs_table.js.map
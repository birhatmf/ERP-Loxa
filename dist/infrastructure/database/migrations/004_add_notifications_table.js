"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const exists = await knex.schema.hasTable('notifications');
    if (exists)
        return;
    await knex.schema.createTable('notifications', (table) => {
        table.string('id').primary();
        table.string('type').notNullable();
        table.string('title').notNullable();
        table.text('message').notNullable();
        table.string('entity_id').nullable();
        table.string('entity_type').nullable();
        table.boolean('read').notNullable().defaultTo(false);
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('notifications');
}
//# sourceMappingURL=004_add_notifications_table.js.map
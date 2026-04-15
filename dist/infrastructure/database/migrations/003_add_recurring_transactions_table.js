"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const exists = await knex.schema.hasTable('recurring_transactions');
    if (exists)
        return;
    await knex.schema.createTable('recurring_transactions', (table) => {
        table.string('id').primary();
        table.text('description').notNullable();
        table.decimal('amount', 15, 2).notNullable();
        table.string('amount_currency', 3).notNullable().defaultTo('TRY');
        table.string('type').notNullable();
        table.string('category').notNullable();
        table.string('payment_method').notNullable();
        table.string('frequency').notNullable();
        table.integer('day_of_month').notNullable();
        table.boolean('is_active').notNullable().defaultTo(true);
        table.timestamp('next_run').notNullable();
        table.timestamp('last_run').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
}
async function down(knex) {
    await knex.schema.dropTableIfExists('recurring_transactions');
}
//# sourceMappingURL=003_add_recurring_transactions_table.js.map
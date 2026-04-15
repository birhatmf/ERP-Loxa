"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const hasColumn = await knex.schema.hasColumn('purchase_orders', 'stock_posted');
    if (!hasColumn) {
        await knex.schema.alterTable('purchase_orders', (table) => {
            table.boolean('stock_posted').notNullable().defaultTo(false);
            table.timestamp('stock_posted_at').nullable();
        });
    }
}
async function down(knex) {
    const hasColumn = await knex.schema.hasColumn('purchase_orders', 'stock_posted');
    if (hasColumn) {
        await knex.schema.alterTable('purchase_orders', (table) => {
            table.dropColumn('stock_posted_at');
            table.dropColumn('stock_posted');
        });
    }
}
//# sourceMappingURL=007_add_purchase_order_stock_posted.js.map
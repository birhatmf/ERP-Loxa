"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.up = up;
exports.down = down;
async function up(knex) {
    const hasManualPrice = await knex.schema.hasColumn('materials', 'manual_price');
    if (!hasManualPrice) {
        await knex.schema.alterTable('materials', (table) => {
            table.decimal('manual_price', 15, 2).nullable();
            table.timestamp('manual_price_updated_at').nullable();
        });
    }
    const hasCorrection = await knex.schema.hasColumn('stock_movements', 'is_correction');
    if (!hasCorrection) {
        await knex.schema.alterTable('stock_movements', (table) => {
            table.boolean('is_correction').notNullable().defaultTo(false);
            table.text('correction_reason').nullable();
            table.timestamp('corrected_at').nullable();
        });
    }
}
async function down(knex) {
    const hasCorrection = await knex.schema.hasColumn('stock_movements', 'is_correction');
    if (hasCorrection) {
        await knex.schema.alterTable('stock_movements', (table) => {
            table.dropColumn('corrected_at');
            table.dropColumn('correction_reason');
            table.dropColumn('is_correction');
        });
    }
    const hasManualPrice = await knex.schema.hasColumn('materials', 'manual_price');
    if (hasManualPrice) {
        await knex.schema.alterTable('materials', (table) => {
            table.dropColumn('manual_price_updated_at');
            table.dropColumn('manual_price');
        });
    }
}
//# sourceMappingURL=008_add_inventory_edit_fields.js.map
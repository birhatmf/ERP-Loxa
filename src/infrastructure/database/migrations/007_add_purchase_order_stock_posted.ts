import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('purchase_orders', 'stock_posted');
  if (!hasColumn) {
    await knex.schema.alterTable('purchase_orders', (table) => {
      table.boolean('stock_posted').notNullable().defaultTo(false);
      table.timestamp('stock_posted_at').nullable();
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('purchase_orders', 'stock_posted');
  if (hasColumn) {
    await knex.schema.alterTable('purchase_orders', (table) => {
      table.dropColumn('stock_posted_at');
      table.dropColumn('stock_posted');
    });
  }
}

import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const workersExists = await knex.schema.hasTable('workers');
  if (!workersExists) {
    await knex.schema.createTable('workers', (table) => {
      table.string('id').primary();
      table.string('name').notNullable();
      table.decimal('monthly_salary', 15, 2).notNullable().defaultTo(0);
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  const monthsExists = await knex.schema.hasTable('worker_salary_months');
  if (!monthsExists) {
    await knex.schema.createTable('worker_salary_months', (table) => {
      table.string('id').primary();
      table.string('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
      table.string('period').notNullable();
      table.decimal('salary', 15, 2).notNullable().defaultTo(0);
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
      table.unique(['worker_id', 'period']);
    });
  }

  const advancesExists = await knex.schema.hasTable('worker_advances');
  if (!advancesExists) {
    await knex.schema.createTable('worker_advances', (table) => {
      table.string('id').primary();
      table.string('worker_id').notNullable().references('id').inTable('workers').onDelete('CASCADE');
      table.string('period').notNullable();
      table.decimal('amount', 15, 2).notNullable();
      table.timestamp('paid_at').notNullable();
      table.text('note').notNullable().defaultTo('');
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('worker_advances');
  await knex.schema.dropTableIfExists('worker_salary_months');
  await knex.schema.dropTableIfExists('workers');
}

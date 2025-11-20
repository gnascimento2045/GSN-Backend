import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.string('name', 100).notNullable()
      table.string('description', 255).nullable()
      table.string('color', 7).nullable() // Cor hexadecimal
      table.string('icon', 50).nullable()
      table.integer('parent_id').unsigned().nullable().references('id').inTable('categories').onDelete('SET NULL')
      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      table.index(['company_id', 'name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

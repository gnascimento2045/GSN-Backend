import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'access_tokens'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('user_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')

      table.string('type').notNullable()
      table.string('token').notNullable().unique()
      table.timestamp('expires_at').nullable()
      table.timestamp('created_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

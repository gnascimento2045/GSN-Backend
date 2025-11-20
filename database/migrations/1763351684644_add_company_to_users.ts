import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('company_id').unsigned().nullable().references('id').inTable('companies').onDelete('CASCADE')
      table.enum('role', ['owner', 'admin', 'manager', 'seller', 'financial', 'stock_manager']).defaultTo('seller')
      table.json('permissions').nullable() // Permissões específicas do usuário
      table.string('phone', 20).nullable()
      table.timestamp('last_login_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('company_id')
      table.dropColumn('role')
      table.dropColumn('permissions')
      table.dropColumn('phone')
      table.dropColumn('last_login_at')
    })
  }
}

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')

      // Ação realizada
      table.string('action', 100).notNullable() // create, update, delete, etc
      table.string('entity_type', 100).notNullable() // product, sale, user, etc
      table.integer('entity_id').unsigned().nullable() // ID da entidade afetada

      // Detalhes
      table.string('description', 500).notNullable()
      table.json('old_values').nullable() // Valores anteriores
      table.json('new_values').nullable() // Valores novos

      // Contexto
      table.string('ip_address', 45).nullable()
      table.string('user_agent', 500).nullable()
      table.json('metadata').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()

      // Índices
      table.index(['company_id', 'created_at'])
      table.index(['user_id', 'created_at'])
      table.index(['entity_type', 'entity_id'])
      table.index(['action'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

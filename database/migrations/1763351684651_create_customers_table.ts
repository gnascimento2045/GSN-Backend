import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'customers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')

      // Identificação
      table.string('name', 255).notNullable()
      table.string('document', 20).nullable() // CPF/CNPJ
      table.string('email', 255).nullable()
      table.string('phone', 20).nullable()
      table.string('mobile', 20).nullable()

      // Endereço
      table.string('zip_code', 10).nullable()
      table.string('street', 255).nullable()
      table.string('number', 20).nullable()
      table.string('complement', 100).nullable()
      table.string('neighborhood', 100).nullable()
      table.string('city', 100).nullable()
      table.string('state', 2).nullable()

      // Fiado/Crédito
      table.decimal('credit_limit', 10, 2).defaultTo(0) // Limite de crédito
      table.decimal('current_debt', 10, 2).defaultTo(0) // Saldo devedor atual
      table.boolean('allow_credit').defaultTo(false) // Permite comprar fiado
      table.boolean('is_blocked').defaultTo(false) // Bloqueado por inadimplência

      // Estatísticas
      table.decimal('total_purchases', 12, 2).defaultTo(0) // Total comprado
      table.integer('total_orders').defaultTo(0) // Número de pedidos
      table.timestamp('last_purchase_at').nullable()

      // Metadata
      table.text('notes').nullable()
      table.date('birth_date').nullable()
      table.json('metadata').nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Índices
      table.index(['company_id', 'name'])
      table.index(['company_id', 'document'])
      table.index(['company_id', 'phone'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

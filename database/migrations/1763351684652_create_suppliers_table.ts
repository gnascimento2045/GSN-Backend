import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'suppliers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')

      // Identificação
      table.string('name', 255).notNullable()
      table.string('legal_name', 255).nullable()
      table.string('document', 20).notNullable() // CNPJ
      table.string('email', 255).nullable()
      table.string('phone', 20).nullable()
      table.string('mobile', 20).nullable()
      table.string('website', 255).nullable()

      // Contato
      table.string('contact_person', 255).nullable()
      table.string('contact_email', 255).nullable()
      table.string('contact_phone', 20).nullable()

      // Endereço
      table.string('zip_code', 10).nullable()
      table.string('street', 255).nullable()
      table.string('number', 20).nullable()
      table.string('complement', 100).nullable()
      table.string('neighborhood', 100).nullable()
      table.string('city', 100).nullable()
      table.string('state', 2).nullable()

      // Informações financeiras
      table.integer('payment_term_days').defaultTo(0) // Prazo de pagamento
      table.decimal('minimum_order_value', 10, 2).nullable()

      // Estatísticas
      table.decimal('total_purchased', 12, 2).defaultTo(0)
      table.integer('total_orders').defaultTo(0)
      table.timestamp('last_purchase_at').nullable()

      // Avaliação
      table.decimal('rating', 2, 1).nullable() // 0.0 a 5.0
      table.text('notes').nullable()

      table.json('metadata').nullable()
      table.boolean('is_active').defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Índices
      table.unique(['company_id', 'document'])
      table.index(['company_id', 'name'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

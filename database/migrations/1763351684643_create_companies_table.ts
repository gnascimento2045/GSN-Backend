import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'companies'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.string('name', 255).notNullable()
      table.string('legal_name', 255).nullable()
      table.string('document', 20).notNullable().unique() // CNPJ
      table.string('email', 255).notNullable()
      table.string('phone', 20).nullable()
      table.string('website', 255).nullable()

      // Endereço
      table.string('zip_code', 10).nullable()
      table.string('street', 255).nullable()
      table.string('number', 20).nullable()
      table.string('complement', 100).nullable()
      table.string('neighborhood', 100).nullable()
      table.string('city', 100).nullable()
      table.string('state', 2).nullable()
      table.string('country', 50).defaultTo('Brasil')

      // Configurações
      table.string('logo_url', 500).nullable()
      table.json('settings').nullable() // Configurações customizadas

      // Plano e Status
      table.enum('plan', ['free', 'basic', 'professional', 'enterprise']).defaultTo('free')
      table.enum('status', ['active', 'inactive', 'suspended', 'trial']).defaultTo('trial')
      table.timestamp('trial_ends_at').nullable()
      table.timestamp('subscription_ends_at').nullable()

      // Limites do plano
      table.integer('max_users').defaultTo(3)
      table.integer('max_products').defaultTo(1000)
      table.integer('max_monthly_sales').defaultTo(500)

      table.boolean('is_active').defaultTo(true)
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

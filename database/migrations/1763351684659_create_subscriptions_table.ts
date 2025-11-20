import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')

      // Plano
      table.enum('plan', ['free', 'basic', 'professional', 'enterprise']).notNullable()
      table.decimal('amount', 10, 2).notNullable()
      table.enum('billing_cycle', ['monthly', 'quarterly', 'yearly']).notNullable()

      // Status
      table.enum('status', ['active', 'cancelled', 'past_due', 'suspended']).defaultTo('active')

      // Datas
      table.timestamp('starts_at', { useTz: true }).notNullable()
      table.timestamp('ends_at', { useTz: true }).nullable()
      table.timestamp('next_billing_at', { useTz: true }).nullable()
      table.timestamp('cancelled_at', { useTz: true }).nullable()

      // Pagamento
      table.enum('payment_method', ['pix', 'credit_card', 'bank_slip', 'stripe']).notNullable()
      table.string('payment_gateway_id', 255).nullable() // ID no Stripe/gateway
      table.string('payment_gateway_customer_id', 255).nullable()

      // Histórico
      table.integer('failed_payments').defaultTo(0)
      table.timestamp('last_payment_at').nullable()
      table.decimal('last_payment_amount', 10, 2).nullable()

      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Índices
      table.index(['company_id', 'status'])
      table.index(['next_billing_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

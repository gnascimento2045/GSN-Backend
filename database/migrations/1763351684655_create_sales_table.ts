import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sales'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('cash_register_id').unsigned().nullable().references('id').inTable('cash_registers').onDelete('SET NULL')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT') // Vendedor
      table.integer('customer_id').unsigned().nullable().references('id').inTable('customers').onDelete('SET NULL')

      // Identificação
      table.string('sale_number', 50).notNullable().unique() // Número da venda
      table.enum('status', ['pending', 'completed', 'cancelled', 'refunded']).defaultTo('completed')

      // Valores
      table.decimal('subtotal', 10, 2).notNullable() // Soma dos itens
      table.decimal('discount_amount', 10, 2).defaultTo(0)
      table.decimal('discount_percentage', 5, 2).defaultTo(0)
      table.decimal('total', 10, 2).notNullable() // Total final

      // Pagamentos
      table.decimal('paid_cash', 10, 2).defaultTo(0)
      table.decimal('paid_pix', 10, 2).defaultTo(0)
      table.decimal('paid_credit', 10, 2).defaultTo(0) // Fiado
      table.decimal('paid_debit', 10, 2).defaultTo(0)
      table.decimal('change_given', 10, 2).defaultTo(0) // Troco

      // Informações adicionais
      table.text('notes').nullable()
      table.string('pix_qr_code', 500).nullable()
      table.string('pix_transaction_id', 100).nullable()

      // Fiado
      table.boolean('is_credit_sale').defaultTo(false)
      table.date('due_date').nullable()
      table.date('paid_at').nullable()

      // Cancelamento
      table.timestamp('cancelled_at').nullable()
      table.integer('cancelled_by').unsigned().nullable().references('id').inTable('users')
      table.text('cancellation_reason').nullable()

      table.json('metadata').nullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Índices
      table.index(['company_id', 'created_at'])
      table.index(['company_id', 'status'])
      table.index(['user_id', 'created_at'])
      table.index(['customer_id'])
      table.index(['cash_register_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

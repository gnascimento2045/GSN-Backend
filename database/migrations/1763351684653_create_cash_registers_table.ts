import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cash_registers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')

      // Identificação do caixa
      table.string('terminal_name', 100).notNullable() // Ex: "Balcão 1", "Balcão 2"
      table.integer('terminal_number').notNullable()

      // Status
      table.enum('status', ['open', 'closed']).notNullable()

      // Abertura
      table.decimal('opening_balance', 10, 2).notNullable().defaultTo(0)
      table.timestamp('opened_at', { useTz: true }).notNullable()
      table.integer('opened_by').unsigned().notNullable().references('id').inTable('users')

      // Fechamento
      table.decimal('closing_balance', 10, 2).nullable()
      table.decimal('expected_balance', 10, 2).nullable()
      table.decimal('difference', 10, 2).nullable() // Diferença entre esperado e real
      table.timestamp('closed_at', { useTz: true }).nullable()
      table.integer('closed_by').unsigned().nullable().references('id').inTable('users')

      // Totais do dia
      table.decimal('total_cash', 10, 2).defaultTo(0) // Total em dinheiro
      table.decimal('total_pix', 10, 2).defaultTo(0) // Total em Pix
      table.decimal('total_credit', 10, 2).defaultTo(0) // Total fiado
      table.decimal('total_sales', 10, 2).defaultTo(0) // Total geral de vendas
      table.integer('sales_count').defaultTo(0) // Número de vendas

      // Movimentações extras
      table.decimal('total_withdrawals', 10, 2).defaultTo(0) // Sangrias
      table.decimal('total_deposits', 10, 2).defaultTo(0) // Suprimentos
      table.decimal('total_expenses', 10, 2).defaultTo(0) // Despesas

      // Observações
      table.text('opening_notes').nullable()
      table.text('closing_notes').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Índices
      table.index(['company_id', 'status'])
      table.index(['company_id', 'opened_at'])
      table.index(['user_id', 'opened_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

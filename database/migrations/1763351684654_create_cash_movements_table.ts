import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cash_movements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('cash_register_id').unsigned().notNullable().references('id').inTable('cash_registers').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')

      // Tipo de movimentação
      table.enum('type', [
        'sale',          // Venda
        'withdrawal',    // Sangria
        'deposit',       // Suprimento
        'expense',       // Despesa
        'change',        // Troco dado
        'opening',       // Abertura de caixa
        'closing'        // Fechamento de caixa
      ]).notNullable()

      // Valores
      table.decimal('amount', 10, 2).notNullable()
      table.enum('payment_method', ['cash', 'pix', 'credit', 'debit', 'other']).nullable()

      // Referências
      table.integer('sale_id').unsigned().nullable()

      // Detalhes
      table.string('description', 255).nullable()
      table.text('notes').nullable()
      table.json('metadata').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()

      // Índices
      table.index(['cash_register_id', 'created_at'])
      table.index(['company_id', 'type'])
      table.index(['sale_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

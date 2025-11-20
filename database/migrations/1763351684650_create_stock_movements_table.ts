import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'stock_movements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('CASCADE')
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('RESTRICT')

      // Tipo de movimentação
      table.enum('type', [
        'purchase',      // Compra de fornecedor
        'sale',          // Venda
        'adjustment',    // Ajuste manual
        'loss',          // Perda/quebra
        'return',        // Devolução
        'transfer',      // Transferência entre locais
        'initial'        // Estoque inicial
      ]).notNullable()

      // Quantidade
      table.decimal('quantity', 12, 3).notNullable()
      table.decimal('previous_stock', 12, 3).notNullable()
      table.decimal('new_stock', 12, 3).notNullable()

      // Valores
      table.decimal('unit_cost', 10, 2).nullable()
      table.decimal('unit_price', 10, 2).nullable()
      table.decimal('total_value', 12, 2).nullable()

      // Referências
      table.integer('sale_id').unsigned().nullable()
      table.integer('supplier_id').unsigned().nullable()
      table.string('invoice_number', 100).nullable()

      // Detalhes
      table.text('reason').nullable() // Motivo do ajuste/perda
      table.text('notes').nullable()
      table.json('metadata').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()

      // Índices
      table.index(['company_id', 'product_id', 'created_at'])
      table.index(['company_id', 'type'])
      table.index(['sale_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

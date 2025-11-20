import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sale_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('sale_id').unsigned().notNullable().references('id').inTable('sales').onDelete('CASCADE')
      table.integer('product_id').unsigned().notNullable().references('id').inTable('products').onDelete('RESTRICT')

      // Produto (snapshot no momento da venda)
      table.string('product_name', 255).notNullable()
      table.string('product_sku', 100).notNullable()

      // Quantidade e valores
      table.decimal('quantity', 10, 3).notNullable()
      table.string('unit', 50).notNullable()
      table.decimal('unit_price', 10, 2).notNullable() // Preço unitário
      table.decimal('cost_price', 10, 2).nullable() // Custo (para cálculo de lucro)
      table.decimal('discount_amount', 10, 2).defaultTo(0)
      table.decimal('discount_percentage', 5, 2).defaultTo(0)
      table.decimal('subtotal', 10, 2).notNullable() // quantity * unit_price
      table.decimal('total', 10, 2).notNullable() // subtotal - discount

      table.timestamp('created_at', { useTz: true }).notNullable()

      // Índices
      table.index(['sale_id'])
      table.index(['product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

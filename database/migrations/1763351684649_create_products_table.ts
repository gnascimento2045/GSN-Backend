import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('company_id').unsigned().notNullable().references('id').inTable('companies').onDelete('CASCADE')
      table.integer('category_id').unsigned().nullable().references('id').inTable('categories').onDelete('SET NULL')

      // Identificação
      table.string('sku', 100).notNullable() // Código interno
      table.string('barcode', 100).nullable() // Código de barras
      table.string('name', 255).notNullable()
      table.text('description').nullable()

      // Estoque
      table.decimal('current_stock', 12, 3).defaultTo(0) // Quantidade atual
      table.decimal('minimum_stock', 12, 3).defaultTo(0) // Estoque mínimo
      table.decimal('maximum_stock', 12, 3).nullable() // Estoque máximo
      table.enum('unit', ['unit', 'box', 'pack', 'kg', 'liter', 'meter']).defaultTo('unit')
      table.decimal('units_per_package', 10, 2).defaultTo(1) // Unidades por caixa/pacote

      // Preços
      table.decimal('cost_price', 10, 2).notNullable().defaultTo(0) // Preço de custo
      table.decimal('sale_price', 10, 2).notNullable().defaultTo(0) // Preço de venda
      table.decimal('wholesale_price', 10, 2).nullable() // Preço atacado
      table.decimal('profit_margin', 5, 2).nullable() // Margem de lucro %

      // Fiscais
      table.string('ncm', 20).nullable()
      table.decimal('tax_percentage', 5, 2).nullable()

      // Validade
      table.date('expiration_date').nullable()
      table.integer('expiration_alert_days').defaultTo(30) // Alertar X dias antes

      // Fornecedor
      table.integer('supplier_id').unsigned().nullable()

      // Imagens
      table.string('image_url', 500).nullable()
      table.json('images').nullable() // Array de URLs de imagens

      // Metadata
      table.json('metadata').nullable() // Campos customizados
      table.boolean('is_active').defaultTo(true)
      table.boolean('allow_negative_stock').defaultTo(false)
      table.boolean('track_stock').defaultTo(true)

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()

      // Índices para performance
      table.unique(['company_id', 'sku'])
      table.index(['company_id', 'barcode'])
      table.index(['company_id', 'name'])
      table.index(['company_id', 'category_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}

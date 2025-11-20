import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Sale from './sale.js'
import Product from './product.js'

export default class SaleItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'sale_id' })
  declare saleId: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column({ columnName: 'product_name' })
  declare productName: string

  @column({ columnName: 'product_sku' })
  declare productSku: string

  @column()
  declare quantity: number

  @column()
  declare unit: string

  @column({ columnName: 'unit_price' })
  declare unitPrice: number

  @column({ columnName: 'cost_price' })
  declare costPrice: number | null

  @column({ columnName: 'discount_amount' })
  declare discountAmount: number

  @column({ columnName: 'discount_percentage' })
  declare discountPercentage: number

  @column()
  declare subtotal: number

  @column()
  declare total: number

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  // Relacionamentos
  @belongsTo(() => Sale)
  declare sale: BelongsTo<typeof Sale>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  // Métodos auxiliares
  public getProfit(): number {
    if (!this.costPrice) return 0
    return (this.unitPrice - this.costPrice) * this.quantity
  }

  public getProfitMargin(): number {
    if (!this.costPrice || this.unitPrice === 0) return 0
    return ((this.unitPrice - this.costPrice) / this.unitPrice) * 100
  }
}

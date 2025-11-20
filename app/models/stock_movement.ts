import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import Product from './product.js'
import User from './user.js'
import Sale from './sale.js'
import Supplier from './supplier.js'

export default class StockMovement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare type: 'purchase' | 'sale' | 'adjustment' | 'loss' | 'return' | 'transfer' | 'initial'

  @column()
  declare quantity: number

  @column({ columnName: 'previous_stock' })
  declare previousStock: number

  @column({ columnName: 'new_stock' })
  declare newStock: number

  @column({ columnName: 'unit_cost' })
  declare unitCost: number | null

  @column({ columnName: 'unit_price' })
  declare unitPrice: number | null

  @column({ columnName: 'total_value' })
  declare totalValue: number | null

  @column({ columnName: 'sale_id' })
  declare saleId: number | null

  @column({ columnName: 'supplier_id' })
  declare supplierId: number | null

  @column({ columnName: 'invoice_number' })
  declare invoiceNumber: string | null

  @column()
  declare reason: string | null

  @column()
  declare notes: string | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  // Relacionamentos
  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Sale)
  declare sale: BelongsTo<typeof Sale>

  @belongsTo(() => Supplier)
  declare supplier: BelongsTo<typeof Supplier>
}

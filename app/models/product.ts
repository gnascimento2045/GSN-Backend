import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import Category from './category.js'
import Supplier from './supplier.js'
import StockMovement from './stock_movement.js'
import SaleItem from './sale_item.js'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'category_id' })
  declare categoryId: number | null

  // Identificação
  @column()
  declare sku: string

  @column()
  declare barcode: string | null

  @column()
  declare name: string

  @column()
  declare description: string | null

  // Estoque
  @column({ columnName: 'current_stock' })
  declare currentStock: number

  @column({ columnName: 'minimum_stock' })
  declare minimumStock: number

  @column({ columnName: 'maximum_stock' })
  declare maximumStock: number | null

  @column()
  declare unit: 'unit' | 'box' | 'pack' | 'kg' | 'liter' | 'meter'

  @column({ columnName: 'units_per_package' })
  declare unitsPerPackage: number

  // Preços
  @column({ columnName: 'cost_price' })
  declare costPrice: number

  @column({ columnName: 'sale_price' })
  declare salePrice: number

  @column({ columnName: 'wholesale_price' })
  declare wholesalePrice: number | null

  @column({ columnName: 'profit_margin' })
  declare profitMargin: number | null

  // Fiscais
  @column()
  declare ncm: string | null

  @column({ columnName: 'tax_percentage' })
  declare taxPercentage: number | null

  // Validade
  @column.date({ columnName: 'expiration_date' })
  declare expirationDate: DateTime | null

  @column({ columnName: 'expiration_alert_days' })
  declare expirationAlertDays: number

  // Fornecedor
  @column({ columnName: 'supplier_id' })
  declare supplierId: number | null

  // Imagens
  @column({ columnName: 'image_url' })
  declare imageUrl: string | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare images: string[] | null

  // Metadata
  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare metadata: Record<string, any> | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'allow_negative_stock' })
  declare allowNegativeStock: boolean

  @column({ columnName: 'track_stock' })
  declare trackStock: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => Supplier)
  declare supplier: BelongsTo<typeof Supplier>

  @hasMany(() => StockMovement)
  declare stockMovements: HasMany<typeof StockMovement>

  @hasMany(() => SaleItem)
  declare saleItems: HasMany<typeof SaleItem>

  // Métodos auxiliares
  public isLowStock(): boolean {
    return this.currentStock <= this.minimumStock
  }

  public isExpiring(daysAhead: number = 30): boolean {
    if (!this.expirationDate) return false
    const today = DateTime.now()
    const daysUntilExpiration = this.expirationDate.diff(today, 'days').days
    return daysUntilExpiration > 0 && daysUntilExpiration <= daysAhead
  }

  public isExpired(): boolean {
    if (!this.expirationDate) return false
    return this.expirationDate < DateTime.now()
  }

  public calculateProfit(): number {
    return this.salePrice - this.costPrice
  }

  public calculateProfitMargin(): number {
    if (this.salePrice === 0) return 0
    return ((this.salePrice - this.costPrice) / this.salePrice) * 100
  }
}

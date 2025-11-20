import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import Product from './product.js'
import StockMovement from './stock_movement.js'

export default class Supplier extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column()
  declare name: string

  @column({ columnName: 'legal_name' })
  declare legalName: string | null

  @column()
  declare document: string

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare mobile: string | null

  @column()
  declare website: string | null

  // Contato
  @column({ columnName: 'contact_person' })
  declare contactPerson: string | null

  @column({ columnName: 'contact_email' })
  declare contactEmail: string | null

  @column({ columnName: 'contact_phone' })
  declare contactPhone: string | null

  // Endereço
  @column({ columnName: 'zip_code' })
  declare zipCode: string | null

  @column()
  declare street: string | null

  @column()
  declare number: string | null

  @column()
  declare complement: string | null

  @column()
  declare neighborhood: string | null

  @column()
  declare city: string | null

  @column()
  declare state: string | null

  // Financeiro
  @column({ columnName: 'payment_term_days' })
  declare paymentTermDays: number

  @column({ columnName: 'minimum_order_value' })
  declare minimumOrderValue: number | null

  // Estatísticas
  @column({ columnName: 'total_purchased' })
  declare totalPurchased: number

  @column({ columnName: 'total_orders' })
  declare totalOrders: number

  @column.dateTime({ columnName: 'last_purchase_at' })
  declare lastPurchaseAt: DateTime | null

  @column()
  declare rating: number | null

  @column()
  declare notes: string | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare metadata: Record<string, any> | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  @hasMany(() => StockMovement)
  declare stockMovements: HasMany<typeof StockMovement>
}

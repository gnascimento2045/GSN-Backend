import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import CashRegister from './cash_register.js'
import User from './user.js'
import Customer from './customer.js'
import SaleItem from './sale_item.js'
import StockMovement from './stock_movement.js'
import CashMovement from './cash_movement.js'

export default class Sale extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'cash_register_id' })
  declare cashRegisterId: number | null

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'customer_id' })
  declare customerId: number | null

  @column({ columnName: 'sale_number' })
  declare saleNumber: string

  @column()
  declare status: 'pending' | 'completed' | 'cancelled' | 'refunded'

  // Valores
  @column()
  declare subtotal: number

  @column({ columnName: 'discount_amount' })
  declare discountAmount: number

  @column({ columnName: 'discount_percentage' })
  declare discountPercentage: number

  @column()
  declare total: number

  // Pagamentos
  @column({ columnName: 'paid_cash' })
  declare paidCash: number

  @column({ columnName: 'paid_pix' })
  declare paidPix: number

  @column({ columnName: 'paid_credit' })
  declare paidCredit: number

  @column({ columnName: 'paid_debit' })
  declare paidDebit: number

  @column({ columnName: 'change_given' })
  declare changeGiven: number

  @column()
  declare notes: string | null

  @column({ columnName: 'pix_qr_code' })
  declare pixQrCode: string | null

  @column({ columnName: 'pix_transaction_id' })
  declare pixTransactionId: string | null

  // Fiado
  @column({ columnName: 'is_credit_sale' })
  declare isCreditSale: boolean

  @column.date({ columnName: 'due_date' })
  declare dueDate: DateTime | null

  @column.date({ columnName: 'paid_at' })
  declare paidAt: DateTime | null

  // Cancelamento
  @column.dateTime({ columnName: 'cancelled_at' })
  declare cancelledAt: DateTime | null

  @column({ columnName: 'cancelled_by' })
  declare cancelledBy: number | null

  @column({ columnName: 'cancellation_reason' })
  declare cancellationReason: string | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => CashRegister)
  declare cashRegister: BelongsTo<typeof CashRegister>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @hasMany(() => SaleItem)
  declare items: HasMany<typeof SaleItem>

  @hasMany(() => StockMovement)
  declare stockMovements: HasMany<typeof StockMovement>

  @hasMany(() => CashMovement)
  declare cashMovements: HasMany<typeof CashMovement>

  // Métodos auxiliares
  @beforeCreate()
  static async generateSaleNumber(sale: Sale) {
    if (!sale.saleNumber) {
      const date = DateTime.now().toFormat('yyyyMMdd')
      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
      sale.saleNumber = `${date}-${random}`
    }
  }

  public getTotalPaid(): number {
    return this.paidCash + this.paidPix + this.paidCredit + this.paidDebit
  }

  public isPaid(): boolean {
    return this.getTotalPaid() >= this.total
  }

  public canCancel(): boolean {
    return this.status === 'completed' && !this.cancelledAt
  }

  public isOverdue(): boolean {
    if (!this.isCreditSale || !this.dueDate || this.paidAt) return false
    return this.dueDate < DateTime.now()
  }
}

import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import CashRegister from './cash_register.js'
import User from './user.js'
import Sale from './sale.js'

export default class CashMovement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'cash_register_id' })
  declare cashRegisterId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare type: 'sale' | 'withdrawal' | 'deposit' | 'expense' | 'change' | 'opening' | 'closing'

  @column()
  declare amount: number

  @column({ columnName: 'payment_method' })
  declare paymentMethod: 'cash' | 'pix' | 'credit' | 'debit' | 'other' | null

  @column({ columnName: 'sale_id' })
  declare saleId: number | null

  @column()
  declare description: string | null

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

  @belongsTo(() => CashRegister)
  declare cashRegister: BelongsTo<typeof CashRegister>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Sale)
  declare sale: BelongsTo<typeof Sale>
}

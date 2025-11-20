import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import User from './user.js'
import CashMovement from './cash_movement.js'
import Sale from './sale.js'

export default class CashRegister extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'terminal_name' })
  declare terminalName: string

  @column({ columnName: 'terminal_number' })
  declare terminalNumber: number

  @column()
  declare status: 'open' | 'closed'

  // Abertura
  @column({ columnName: 'opening_balance' })
  declare openingBalance: number

  @column.dateTime({ columnName: 'opened_at' })
  declare openedAt: DateTime

  @column({ columnName: 'opened_by' })
  declare openedBy: number

  // Fechamento
  @column({ columnName: 'closing_balance' })
  declare closingBalance: number | null

  @column({ columnName: 'expected_balance' })
  declare expectedBalance: number | null

  @column()
  declare difference: number | null

  @column.dateTime({ columnName: 'closed_at' })
  declare closedAt: DateTime | null

  @column({ columnName: 'closed_by' })
  declare closedBy: number | null

  // Totais
  @column({ columnName: 'total_cash' })
  declare totalCash: number

  @column({ columnName: 'total_pix' })
  declare totalPix: number

  @column({ columnName: 'total_credit' })
  declare totalCredit: number

  @column({ columnName: 'total_sales' })
  declare totalSales: number

  @column({ columnName: 'sales_count' })
  declare salesCount: number

  @column({ columnName: 'total_withdrawals' })
  declare totalWithdrawals: number

  @column({ columnName: 'total_deposits' })
  declare totalDeposits: number

  @column({ columnName: 'total_expenses' })
  declare totalExpenses: number

  @column({ columnName: 'opening_notes' })
  declare openingNotes: string | null

  @column({ columnName: 'closing_notes' })
  declare closingNotes: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relacionamentos
  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'openedBy',
  })
  declare opener: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'closedBy',
  })
  declare closer: BelongsTo<typeof User>

  @hasMany(() => CashMovement)
  declare movements: HasMany<typeof CashMovement>

  @hasMany(() => Sale)
  declare sales: HasMany<typeof Sale>

  // Métodos auxiliares
  public calculateExpectedBalance(): number {
    return (
      this.openingBalance +
      this.totalCash +
      this.totalPix -
      this.totalWithdrawals +
      this.totalDeposits -
      this.totalExpenses
    )
  }

  public canClose(): boolean {
    return this.status === 'open'
  }

  public isOpen(): boolean {
    return this.status === 'open'
  }
}

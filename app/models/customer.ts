import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import Sale from './sale.js'

export default class Customer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column()
  declare name: string

  @column()
  declare document: string | null

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare mobile: string | null

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

  // Crédito
  @column({ columnName: 'credit_limit' })
  declare creditLimit: number

  @column({ columnName: 'current_debt' })
  declare currentDebt: number

  @column({ columnName: 'allow_credit' })
  declare allowCredit: boolean

  @column({ columnName: 'is_blocked' })
  declare isBlocked: boolean

  // Estatísticas
  @column({ columnName: 'total_purchases' })
  declare totalPurchases: number

  @column({ columnName: 'total_orders' })
  declare totalOrders: number

  @column.dateTime({ columnName: 'last_purchase_at' })
  declare lastPurchaseAt: DateTime | null

  @column()
  declare notes: string | null

  @column.date({ columnName: 'birth_date' })
  declare birthDate: DateTime | null

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

  @hasMany(() => Sale)
  declare sales: HasMany<typeof Sale>

  // Métodos auxiliares
  public hasAvailableCredit(amount: number): boolean {
    return this.allowCredit && !this.isBlocked && this.currentDebt + amount <= this.creditLimit
  }

  public getRemainingCredit(): number {
    return Math.max(0, this.creditLimit - this.currentDebt)
  }

  public shouldBeBlocked(): boolean {
    return this.currentDebt >= this.creditLimit
  }
}

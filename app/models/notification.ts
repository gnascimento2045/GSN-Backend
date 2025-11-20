import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import User from './user.js'

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare type:
    | 'low_stock'
    | 'product_expiring'
    | 'cash_difference'
    | 'payment_received'
    | 'credit_overdue'
    | 'system'
    | 'alert'
    | 'info'

  @column()
  declare priority: 'low' | 'medium' | 'high' | 'urgent'

  @column()
  declare title: string

  @column()
  declare message: string

  @column({ columnName: 'action_url' })
  declare actionUrl: string | null

  @column({ columnName: 'action_label' })
  declare actionLabel: string | null

  @column({ columnName: 'is_read' })
  declare isRead: boolean

  @column.dateTime({ columnName: 'read_at' })
  declare readAt: DateTime | null

  @column({ columnName: 'entity_type' })
  declare entityType: string | null

  @column({ columnName: 'entity_id' })
  declare entityId: number | null

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

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  // Métodos auxiliares
  public markAsRead() {
    this.isRead = true
    this.readAt = DateTime.now()
  }
}

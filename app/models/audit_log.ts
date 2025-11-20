import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Company from './company.js'
import User from './user.js'

export default class AuditLog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare action: string

  @column({ columnName: 'entity_type' })
  declare entityType: string

  @column({ columnName: 'entity_id' })
  declare entityId: number | null

  @column()
  declare description: string

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare oldValues: Record<string, any> | null

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare newValues: Record<string, any> | null

  @column({ columnName: 'ip_address' })
  declare ipAddress: string | null

  @column({ columnName: 'user_agent' })
  declare userAgent: string | null

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
}

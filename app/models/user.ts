import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import hash from '@adonisjs/core/services/hash'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import AccessTokenModel from '#models/access_token'
import Company from './company.js'
import Sale from './sale.js'
import AuditLog from './audit_log.js'
import Notification from './notification.js'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'company_id' })
  declare companyId: number | null

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: 'owner' | 'admin' | 'manager' | 'seller' | 'financial' | 'stock_manager'

  @column({
    prepare: (value: any) => (value ? JSON.stringify(value) : null),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare permissions: Record<string, boolean> | null

  @column()
  declare phone: string | null

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'is_admin' })
  declare isAdmin: boolean

  @column()
  declare avatar: string | null

  @column.dateTime({ columnName: 'last_login_at' })
  declare lastLoginAt: DateTime | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @belongsTo(() => Company)
  declare company: BelongsTo<typeof Company>

  @hasMany(() => AccessTokenModel)
  declare accessTokens: HasMany<typeof AccessTokenModel>

  @hasMany(() => Sale)
  declare sales: HasMany<typeof Sale>

  @hasMany(() => AuditLog)
  declare auditLogs: HasMany<typeof AuditLog>

  @hasMany(() => Notification)
  declare notifications: HasMany<typeof Notification>

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.isDirty('password')) {
      user.password = await hash.make(user.password)
    }
  }

  declare currentAccessToken?: AccessToken

  // Métodos de permissão
  public hasPermission(permission: string): boolean {
    if (this.role === 'owner' || this.role === 'admin') return true
    if (!this.permissions) return false
    return this.permissions[permission] === true
  }

  public can(action: string, resource: string): boolean {
    const permission = `${resource}.${action}`
    return this.hasPermission(permission)
  }

  public isOwner(): boolean {
    return this.role === 'owner'
  }

  public isManager(): boolean {
    return this.role === 'manager' || this.role === 'admin' || this.role === 'owner'
  }
}

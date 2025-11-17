import { DateTime } from 'luxon'
import { BaseModel, beforeSave, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import hash from '@adonisjs/core/services/hash'
import { AccessToken } from '@adonisjs/auth/access_tokens'
import AccessTokenModel from '#models/access_token'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'is_admin' })
  declare isAdmin: boolean

  @column()
  declare avatar: string | null

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  @hasMany(() => AccessTokenModel)
  declare accessTokens: HasMany<typeof AccessTokenModel>

  @beforeSave()
  static async hashPassword(user: User) {
    if (user.isDirty('password')) {
      user.password = await hash.make(user.password)
    }
  }

  declare currentAccessToken?: AccessToken
}

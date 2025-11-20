import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, beforeCreate } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Product from './product.js'
import Category from './category.js'
import Customer from './customer.js'
import Supplier from './supplier.js'
import Sale from './sale.js'
import CashRegister from './cash_register.js'

export default class Company extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'legal_name' })
  declare legalName: string | null

  @column()
  declare document: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare website: string | null

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

  @column()
  declare country: string

  // Configurações
  @column({ columnName: 'logo_url' })
  declare logoUrl: string | null

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare settings: Record<string, any> | null

  // Plano
  @column()
  declare plan: 'free' | 'basic' | 'professional' | 'enterprise'

  @column()
  declare status: 'active' | 'inactive' | 'suspended' | 'trial'

  @column.dateTime({ columnName: 'trial_ends_at' })
  declare trialEndsAt: DateTime | null

  @column.dateTime({ columnName: 'subscription_ends_at' })
  declare subscriptionEndsAt: DateTime | null

  @column({ columnName: 'max_users' })
  declare maxUsers: number

  @column({ columnName: 'max_products' })
  declare maxProducts: number

  @column({ columnName: 'max_monthly_sales' })
  declare maxMonthlySales: number

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true, columnName: 'updated_at' })
  declare updatedAt: DateTime

  // Relacionamentos
  @hasMany(() => User)
  declare users: HasMany<typeof User>

  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  @hasMany(() => Category)
  declare categories: HasMany<typeof Category>

  @hasMany(() => Customer)
  declare customers: HasMany<typeof Customer>

  @hasMany(() => Supplier)
  declare suppliers: HasMany<typeof Supplier>

  @hasMany(() => Sale)
  declare sales: HasMany<typeof Sale>

  @hasMany(() => CashRegister)
  declare cashRegisters: HasMany<typeof CashRegister>
}

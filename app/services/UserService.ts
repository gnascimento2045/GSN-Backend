import BaseService from '#services/BaseService'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { Exception } from '@adonisjs/core/exceptions'

export default class UserService extends BaseService<typeof User> {
  constructor() {
    super(User)
  }

  protected getAllowedRelations(): string[] {
    return ['accessTokens']
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'name', 'email', 'createdAt', 'updatedAt']
  }

  protected getAllowedFilterFields(): string[] {
    return ['name', 'email', 'isActive']
  }

  protected sanitizeInput(data: Record<string, any>): Record<string, any> {
    const sanitized = super.sanitizeInput(data)

    delete sanitized.isAdmin
    delete sanitized.currentAccessToken

    return sanitized
  }

  async create(data: Record<string, any>) {
    await this.validateUniqueEmail(data.email)

    data.isActive = data.isActive !== undefined ? data.isActive : true
    data.isAdmin = false

    return await super.create(data)
  }

  async update(id: string | number, data: Record<string, any>) {
    if (data.email) {
      await this.validateUniqueEmail(data.email, id)
    }


    return await super.update(id, data)
  }

  async findByEmail(email: string) {
    return await this.model.query().where('email', email).first()
  }

  async verifyCredentials(email: string, password: string) {
    const user = await this.findByEmail(email)

    if (!user) {
      throw new Exception('Credenciais inválidas', {
        status: 401,
        code: 'INVALID_CREDENTIALS'
      })
    }

    if (!user.isActive) {
      throw new Exception('Conta desativada', {
        status: 403,
        code: 'ACCOUNT_DISABLED'
      })
    }

    const isValid = await hash.verify(user.password, password)

    if (!isValid) {
      throw new Exception('Credenciais inválidas', {
        status: 401,
        code: 'INVALID_CREDENTIALS'
      })
    }

    return user
  }

  async changePassword(userId: string | number, oldPassword: string, newPassword: string) {
    const user = await this.findById(userId)

    const isValid = await hash.verify(user.password, oldPassword)

    if (!isValid) {
      throw new Exception('Senha atual incorreta', {
        status: 400,
        code: 'INVALID_OLD_PASSWORD'
      })
    }

    user.password = await hash.make(newPassword)
    await user.save()

    return user
  }

  private async validateUniqueEmail(email: string, excludeId?: string | number) {
    let query = this.model.query().where('email', email)

    if (excludeId) {
      query = query.whereNot('id', excludeId)
    }

    const existing = await query.first()

    if (existing) {
      throw new Exception('Email já está em uso', {
        status: 422,
        code: 'EMAIL_ALREADY_EXISTS'
      })
    }
  }
}

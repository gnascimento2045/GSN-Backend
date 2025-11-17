import BaseController from '#controllers/BaseController'
import UserService from '#services/UserService'
import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import { createUserValidator, updateUserValidator } from '#validators/UserValidator'

export default class UsersController extends BaseController {
  constructor() {
    super(new UserService())
  }

  protected getValidator(): any {
    return createUserValidator
  }

  async store(ctx: HttpContext) {
    const payload = await ctx.request.validateUsing(createUserValidator)

    try {
      const data = await this.service.create(payload)
      return ctx.response.created(this.success('Usuário criado com sucesso', data))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao criar usuário')
    }
  }

  async update(ctx: HttpContext) {
    const { params } = ctx
    const payload = await ctx.request.validateUsing(updateUserValidator)

    try {
      const data = await this.service.update(params.id, payload)
      return ctx.response.ok(this.success('Usuário atualizado com sucesso', data))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao atualizar usuário')
    }
  }

  async profile(ctx: HttpContext) {
    try {
      const user = await ctx.auth.getUserOrFail()
      return ctx.response.ok(this.success('Perfil recuperado com sucesso', user))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao recuperar perfil')
    }
  }

  async updateProfile(ctx: HttpContext) {
    try {
      const user = (await ctx.auth.getUserOrFail()) as User
      const payload = await ctx.request.validateUsing(updateUserValidator)

      const updated = await this.service.update(user.id, payload)
      return ctx.response.ok(this.success('Perfil atualizado com sucesso', updated))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao atualizar perfil')
    }
  }

  async changePassword(ctx: HttpContext) {
    try {
      const user = (await ctx.auth.getUserOrFail()) as User
      const { oldPassword, newPassword } = ctx.request.only(['oldPassword', 'newPassword'])

      if (!oldPassword || !newPassword) {
        return ctx.response.badRequest(this.error('Senhas são obrigatórias', 'MISSING_PASSWORDS'))
      }

      await (this.service as UserService).changePassword(user.id, oldPassword, newPassword)

      return ctx.response.ok(this.success('Senha alterada com sucesso'))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao alterar senha')
    }
  }

  async uploadAvatar(ctx: HttpContext) {
    try {
      const user = (await ctx.auth.getUserOrFail()) as User
      const avatar = ctx.request.file('avatar', {
        size: '2mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (!avatar) {
        return ctx.response.badRequest(this.error('Nenhum arquivo enviado', 'NO_FILE'))
      }

      const path = await this.service.uploadSingle(avatar, 'avatars')
      const updated = await this.service.update(user.id, { avatar: path })

      return ctx.response.ok(this.success('Avatar atualizado com sucesso', updated))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao atualizar avatar')
    }
  }
}

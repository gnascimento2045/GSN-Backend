import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'crypto'
import UserService from '#services/UserService'
import AccessToken from '#models/access_token'
import User from '#models/user'
import { loginValidator, createUserValidator } from '#validators/UserValidator'

export default class AuthController {
  private userService: UserService = new UserService()

  private generateSecureToken(): string {
    return randomUUID()
  }

  async register(ctx: HttpContext) {
    try {
      const payload = await ctx.request.validateUsing(createUserValidator)
      const user = await this.userService.create(payload)

      const token = new AccessToken()
      token.token = await this.generateSecureToken()
      token.type = 'api'
      await user.related('accessTokens').save(token)

      return ctx.response.created({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: { user, token: token.token },
      })
    } catch (error: any) {
      return ctx.response.badRequest({
        success: false,
        message: 'Erro ao registrar usuário',
        error: error.message,
      })
    }
  }

  async login(ctx: HttpContext) {
    try {
      const { email, password } = await ctx.request.validateUsing(loginValidator)
      const user = await this.userService.verifyCredentials(email, password)

      const token = new AccessToken()
      token.token = this.generateSecureToken()
      token.type = 'api'
      token.userId = user.id
      await token.save()

      return ctx.response.ok({
        success: true,
        message: 'Login realizado com sucesso',
        data: { user, token: token.token },
      })
    } catch (error: any) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Credenciais inválidas',
        error: error.code || error.message,
      })
    }
  }

  async logout(ctx: HttpContext) {
    try {
      return ctx.response.ok({
        success: true,
        message: 'Logout realizado com sucesso',
      })
    } catch (error: any) {
      return ctx.response.internalServerError({
        success: false,
        message: 'Erro ao realizar logout',
        error: error.message,
      })
    }
  }

  async me(ctx: HttpContext) {
    try {
      const user = await ctx.auth.getUserOrFail()
      return ctx.response.ok({
        success: true,
        message: 'Usuário autenticado',
        data: user,
      })
    } catch (error: any) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Não autenticado',
        error: error.message,
      })
    }
  }

  async refresh(ctx: HttpContext) {
    try {
      const user = (await ctx.auth.getUserOrFail()) as User

      const token = new AccessToken()
      token.token = this.generateSecureToken()
      token.type = 'api'
      token.userId = user.id
      await token.save()

      return ctx.response.ok({
        success: true,
        message: 'Token renovado com sucesso',
        data: { token: token.token },
      })
    } catch (error: any) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Erro ao renovar token',
        error: error.message,
      })
    }
  }
}

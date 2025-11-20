import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware para garantir que o usuário tenha acesso apenas aos dados de sua empresa (multi-tenant)
 */
export default class TenantMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth } = ctx
    const user = auth.user

    if (!user) {
      return ctx.response.unauthorized({ message: 'Usuário não autenticado' })
    }

    if (!user.companyId) {
      return ctx.response.forbidden({
        message: 'Usuário não vinculado a nenhuma empresa',
      })
    }

    // Adiciona companyId no contexto para uso nos controllers
    ctx.tenant = {
      companyId: user.companyId,
      user: user,
    }

    await next()
  }
}

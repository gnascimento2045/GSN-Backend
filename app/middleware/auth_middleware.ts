import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import type { Authenticators } from '@adonisjs/auth/types'
import { Exception } from '@adonisjs/core/exceptions'
import User from '#models/user'

export default class AuthMiddleware {
  redirectTo = '/login'

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {}
  ) {
    await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo })

    const user = (ctx.auth.getUserOrFail()) as User

    if (!user.isActive) {
      throw new Exception('Conta desativada', {
        status: 403,
        code: 'ACCOUNT_DISABLED',
      })
    }

    return next()
  }
}

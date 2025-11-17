import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { Exception } from '@adonisjs/core/exceptions'
// import redis from '@adonisjs/redis/services/redis'
import User from '#models/user'

export default class RateLimitMiddleware {
  private maxAttempts: number = 60

  async handle(ctx: HttpContext, next: NextFn) {
    const key = this.getKey(ctx)
    const current = await this.incrementAttempts(key)

    if (current > this.maxAttempts) {
      throw new Exception('Muitas requisições. Tente novamente mais tarde.', {
        status: 429,
        code: 'TOO_MANY_REQUESTS'
      })
    }

    ctx.response.header('X-RateLimit-Limit', this.maxAttempts.toString())
    ctx.response.header('X-RateLimit-Remaining', Math.max(0, this.maxAttempts - current).toString())

    await next()
  }

  private getKey(ctx: HttpContext): string {
    const ip = ctx.request.ip()
    const userId = ((ctx.auth.user as User)?.id) || 'guest'
    return `rate_limit:${userId}:${ip}`
  }

  private async incrementAttempts(_key: string): Promise<number> {
    // TODO: Implementar rate limit com redis quando instalado
    return 1
  }
}

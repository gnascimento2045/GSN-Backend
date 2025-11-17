import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SecurityHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    ctx.response.header('X-Frame-Options', 'DENY')
    ctx.response.header('X-XSS-Protection', '1; mode=block')
    ctx.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    ctx.response.header('Content-Security-Policy', "default-src 'self'")
    ctx.response.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    ctx.response.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

    await next()
  }
}

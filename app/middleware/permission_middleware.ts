import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware para verificar permissões baseadas em roles
 */
export default class PermissionMiddleware {
  /**
   * Verifica se o usuário tem a role necessária
   */
  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      roles?: string[]
      permissions?: string[]
    } = {}
  ) {
    const { auth, response } = ctx
    const user = auth.user

    if (!user) {
      return response.unauthorized({ message: 'Usuário não autenticado' })
    }

    const { roles = [], permissions = [] } = options

    // Verifica roles
    if (roles.length > 0) {
      const hasRole = roles.includes(user.role)
      if (!hasRole && user.role !== 'owner') {
        return response.forbidden({
          message: 'Você não tem permissão para acessar este recurso',
          required_roles: roles,
          your_role: user.role,
        })
      }
    }

    // Verifica permissões específicas
    if (permissions.length > 0) {
      const hasPermission = permissions.some((permission) => user.hasPermission(permission))
      if (!hasPermission && user.role !== 'owner') {
        return response.forbidden({
          message: 'Você não tem as permissões necessárias',
          required_permissions: permissions,
        })
      }
    }

    await next()
  }
}

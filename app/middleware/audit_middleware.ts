import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import AuditLog from '#models/audit_log'

/**
 * Middleware para registrar ações importantes no sistema (auditoria)
 */
export default class AuditMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const { auth, request, response } = ctx
    const user = auth.user

    // Continue a requisição
    await next()

    // Registra apenas ações que modificam dados (POST, PUT, PATCH, DELETE)
    const methodsToAudit = ['POST', 'PUT', 'PATCH', 'DELETE']
    if (!methodsToAudit.includes(request.method())) {
      return
    }

    // Não audita se não for sucesso
    if (response.getStatus() >= 400) {
      return
    }

    try {
      // Extrai informações da rota
      const route = ctx.route?.pattern || request.url()
      const action = this.getActionFromMethod(request.method())
      const entityType = this.getEntityTypeFromRoute(route)

      // Só registra se conseguir identificar a entidade
      if (!entityType || !user) return

      const auditData = {
        companyId: user.companyId,
        userId: user.id,
        action,
        entityType,
        entityId: this.getEntityIdFromRequest(ctx),
        description: this.generateDescription(action, entityType, user.name),
        oldValues: null, // Pode ser implementado com um hook no model
        newValues: request.body(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent'),
        metadata: {
          route,
          method: request.method(),
        },
      }

      // Salva de forma assíncrona para não bloquear a resposta
      await AuditLog.create(auditData)
    } catch (error) {
      // Log de erro silencioso - não deve quebrar a aplicação
      console.error('Erro ao registrar auditoria:', error)
    }
  }

  private getActionFromMethod(method: string): string {
    const actions: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
    }
    return actions[method] || 'unknown'
  }

  private getEntityTypeFromRoute(route: string): string | null {
    // Extrai o tipo de entidade da rota
    // Ex: /api/v1/products -> products
    const match = route.match(/\/api\/v\d+\/([^\/\?]+)/)
    return match ? match[1] : null
  }

  private getEntityIdFromRequest(ctx: HttpContext): number | null {
    // Tenta extrair ID dos parâmetros
    const id = ctx.params.id || ctx.response.getHeader('X-Entity-Id')
    return id ? parseInt(id, 10) : null
  }

  private generateDescription(action: string, entityType: string, userName: string): string {
    const descriptions: Record<string, string> = {
      create: `${userName} criou um(a) ${entityType}`,
      update: `${userName} atualizou um(a) ${entityType}`,
      delete: `${userName} excluiu um(a) ${entityType}`,
    }
    return descriptions[action] || `${userName} executou ação em ${entityType}`
  }
}

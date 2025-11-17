import type { HttpContext } from '@adonisjs/core/http'
import BaseService from '#services/BaseService'
import { Exception } from '@adonisjs/core/exceptions'

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?: string
  meta?: any
}

export default abstract class BaseController {
  protected service: BaseService<any>

  constructor(service: BaseService<any>) {
    this.service = service
  }

  protected extractQueryParams(ctx: HttpContext) {
    const { request } = ctx

    return {
      include: this.sanitizeInclude(request.input('include')),
      filter: this.sanitizeFilters(request.input('filter')),
      sort: this.sanitizeSort(request.input('sort')),
      page: this.sanitizePage(request.input('page')),
      limit: this.sanitizeLimit(request.input('limit')),
    }
  }

  protected sanitizeInclude(include?: string): string | undefined {
    if (!include || typeof include !== 'string') return undefined
    return include.replace(/[^a-zA-Z0-9,_]/g, '')
  }

  protected sanitizeSort(sort?: string): string | undefined {
    if (!sort || typeof sort !== 'string') return undefined
    return sort.replace(/[^a-zA-Z0-9,_-]/g, '')
  }

  protected sanitizeFilters(filters?: Record<string, any>): Record<string, any> | undefined {
    if (!filters || typeof filters !== 'object') return undefined

    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(filters)) {
      const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '')
      if (cleanKey) {
        sanitized[cleanKey] = value
      }
    }

    return Object.keys(sanitized).length > 0 ? sanitized : undefined
  }

  protected sanitizePage(page?: any): number | undefined {
    const parsed = parseInt(page)
    return isNaN(parsed) || parsed < 1 ? undefined : parsed
  }

  protected sanitizeLimit(limit?: any): number | undefined {
    const parsed = parseInt(limit)
    return isNaN(parsed) || parsed < 1 ? undefined : parsed
  }

  protected success<T>(message: string, data?: T, meta?: any): ApiResponse<T> {
    return {
      success: true,
      message,
      data,
      meta,
    }
  }

  protected error(message: string, error?: string): ApiResponse {
    return {
      success: false,
      message,
      error,
    }
  }

  async index(ctx: HttpContext) {
    try {
      const params = this.extractQueryParams(ctx)
      const data = await this.service.findAll(params)

      return ctx.response.ok(this.success('Registros recuperados com sucesso', data))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao buscar registros')
    }
  }

  async paginate(ctx: HttpContext) {
    try {
      const params = this.extractQueryParams(ctx)
      const result = await this.service.paginate(params)

      return ctx.response.ok(
        this.success('Registros recuperados com sucesso', result.all(), result.getMeta())
      )
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao buscar registros')
    }
  }

  async show(ctx: HttpContext) {
    try {
      const { params, request } = ctx
      const include = this.sanitizeInclude(request.input('include'))

      const data = await this.service.findById(params.id, include)

      return ctx.response.ok(this.success('Registro recuperado com sucesso', data))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao buscar registro')
    }
  }

  async store(ctx: HttpContext) {
    try {
      const payload = await this.validate(ctx)
      const data = await this.service.create(payload)

      return ctx.response.created(this.success('Registro criado com sucesso', data))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao criar registro')
    }
  }

  async update(ctx: HttpContext) {
    try {
      const { params } = ctx
      const payload = await this.validate(ctx)

      const data = await this.service.update(params.id, payload)

      return ctx.response.ok(this.success('Registro atualizado com sucesso', data))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao atualizar registro')
    }
  }

  async destroy(ctx: HttpContext) {
    try {
      const { params } = ctx
      await this.service.delete(params.id)

      return ctx.response.ok(this.success('Registro deletado com sucesso'))
    } catch (error) {
      return this.handleError(ctx, error, 'Erro ao deletar registro')
    }
  }

  protected async validate(ctx: HttpContext): Promise<Record<string, any>> {
    const validator = this.getValidator()

    if (validator) {
      return await ctx.request.validateUsing(validator)
    }

    return ctx.request.all()
  }

  protected getValidator(): any {
    return null
  }

  protected handleError(ctx: HttpContext, error: any, defaultMessage: string) {
    if (error instanceof Exception) {
      const status = error.status || 500
      return ctx.response.status(status).json(
        this.error(error.message, error.code)
      )
    }

    if (error.messages) {
      return ctx.response.badRequest(
        this.error('Erro de validação', JSON.stringify(error.messages))
      )
    }

    return ctx.response.internalServerError(
      this.error(defaultMessage, error.message)
    )
  }
}

import type { LucidModel, ModelQueryBuilderContract } from '@adonisjs/lucid/types/model'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import { Exception } from '@adonisjs/core/exceptions'

interface QueryParams {
  include?: string
  filter?: Record<string, any>
  sort?: string
  page?: number
  limit?: number
}

export default abstract class BaseService<T extends LucidModel> {
  protected model: T
  protected maxLimit: number = 100
  protected defaultLimit: number = 15

  constructor(model: T) {
    this.model = model
  }

  protected sanitizeLimit(limit?: number): number {
    if (!limit || limit < 1) return this.defaultLimit
    return Math.min(limit, this.maxLimit)
  }

  protected sanitizePage(page?: number): number {
    if (!page || page < 1) return 1
    return page
  }

  protected validateRelations(include: string): string[] {
    const allowedRelations = this.getAllowedRelations()
    const requested = include.split(',').map(r => r.trim())

    const invalid = requested.filter(r => !allowedRelations.includes(r))
    if (invalid.length > 0) {
      throw new Exception(`Relações inválidas: ${invalid.join(', ')}`, {
        status: 400,
        code: 'INVALID_RELATIONS'
      })
    }

    return requested
  }

  protected getAllowedRelations(): string[] {
    return []
  }

  protected validateSortFields(sort: string): void {
    const allowedFields = this.getAllowedSortFields()
    const fields = sort.split(',').map(f => f.trim().replace(/^-/, ''))

    const invalid = fields.filter(f => !allowedFields.includes(f))
    if (invalid.length > 0) {
      throw new Exception(`Campos de ordenação inválidos: ${invalid.join(', ')}`, {
        status: 400,
        code: 'INVALID_SORT_FIELDS'
      })
    }
  }

  protected getAllowedSortFields(): string[] {
    return ['id', 'createdAt', 'updatedAt']
  }

  protected validateFilterFields(filters: Record<string, any>): void {
    const allowedFields = this.getAllowedFilterFields()
    const requestedFields = Object.keys(filters)

    const invalid = requestedFields.filter(f => !allowedFields.includes(f))
    if (invalid.length > 0) {
      throw new Exception(`Campos de filtro inválidos: ${invalid.join(', ')}`, {
        status: 400,
        code: 'INVALID_FILTER_FIELDS'
      })
    }
  }

  protected getAllowedFilterFields(): string[] {
    return []
  }

  protected applyRelations(query: ModelQueryBuilderContract<T, any>, include?: string) {
    if (!include) return query

    const relations = this.validateRelations(include)
    relations.forEach(relation => {
      query.preload(relation as any)
    })

    return query
  }

  protected applyFilters(query: ModelQueryBuilderContract<T, any>, filters?: Record<string, any>) {
    if (!filters || Object.keys(filters).length === 0) return query

    this.validateFilterFields(filters)

    Object.entries(filters).forEach(([key, value]) => {
      if (value === null || value === undefined) return

      if (typeof value === 'string' && value.startsWith('%') && value.endsWith('%')) {
        query.where(key, 'ILIKE', value)
      } else if (Array.isArray(value)) {
        query.whereIn(key, value)
      } else {
        query.where(key, value)
      }
    })

    return query
  }

  protected applySort(query: ModelQueryBuilderContract<T, any>, sort?: string) {
    if (!sort) {
      return query.orderBy('createdAt', 'desc')
    }

    this.validateSortFields(sort)

    const fields = sort.split(',').map(f => f.trim())
    fields.forEach(field => {
      if (field.startsWith('-')) {
        query.orderBy(field.substring(1), 'desc')
      } else {
        query.orderBy(field, 'asc')
      }
    })

    return query
  }

  protected buildQuery(params: QueryParams = {}) {
    let query = this.model.query()

    query = this.applyRelations(query, params.include)
    query = this.applyFilters(query, params.filter)
    query = this.applySort(query, params.sort)

    return query
  }

  async findAll(params: QueryParams = {}) {
    const query = this.buildQuery(params)
    return await query.exec()
  }

  async paginate(params: QueryParams = {}) {
    const page = this.sanitizePage(params.page)
    const limit = this.sanitizeLimit(params.limit)

    const query = this.buildQuery(params)
    return await query.paginate(page, limit)
  }

  async findById(id: string | number, include?: string) {
    let query = this.model.query().where('id', id)

    if (include) {
      query = this.applyRelations(query, include)
    }

    const record = await query.first()

    if (!record) {
      throw new Exception('Registro não encontrado', {
        status: 404,
        code: 'RECORD_NOT_FOUND'
      })
    }

    return record
  }

  async create(data: Record<string, any>) {
    const sanitized = this.sanitizeInput(data)
    return await this.model.create(sanitized as any)
  }

  async update(id: string | number, data: Record<string, any>) {
    const record = await this.findById(id)
    const sanitized = this.sanitizeInput(data)
    return await record.merge(sanitized as any).save()
  }

  async delete(id: string | number) {
    const record = await this.findById(id)
    await record.delete()
    return record
  }

  protected sanitizeInput(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data }

    delete sanitized.id
    delete sanitized.createdAt
    delete sanitized.updatedAt

    return sanitized
  }

  async uploadSingle(file: MultipartFile, folder: string = 'uploads'): Promise<string> {
    if (!file.isValid) {
      throw new Exception('Arquivo inválido', {
        status: 400,
        code: 'INVALID_FILE'
      })
    }

    const uniqueName = `${cuid()}.${file.extname}`
    const uploadPath = app.makePath(`storage/${folder}`)

    try {
      await file.move(uploadPath, {
        name: uniqueName,
        overwrite: false,
      })
    } catch (error) {
      throw new Exception('Falha ao fazer upload do arquivo', {
        status: 500,
        code: 'UPLOAD_FAILED'
      })
    }

    return `${folder}/${uniqueName}`
  }

  async uploadMultiple(files: MultipartFile[], folder: string = 'uploads'): Promise<string[]> {
    const paths: string[] = []

    for (const file of files) {
      const path = await this.uploadSingle(file, folder)
      paths.push(path)
    }

    return paths
  }
}

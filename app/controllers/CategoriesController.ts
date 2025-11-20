import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'

export default class CategoriesController {
  /**
   * Lista categorias
   * GET /api/v1/categories
   */
  async index({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { isActive, parentId } = request.qs()

    const query = Category.query()
      .where('company_id', companyId)
      .preload('parent')
      .withCount('products')

    if (isActive !== undefined) {
      query.where('is_active', isActive === 'true')
    }

    if (parentId !== undefined) {
      if (parentId === 'null') {
        query.whereNull('parent_id')
      } else {
        query.where('parent_id', parentId)
      }
    }

    const categories = await query.orderBy('name', 'asc')

    return categories
  }

  /**
   * Busca categoria por ID
   * GET /api/v1/categories/:id
   */
  async show({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const category = await Category.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .preload('parent')
      .preload('children')
      .withCount('products')
      .firstOrFail()

    return category
  }

  /**
   * Cria categoria
   * POST /api/v1/categories
   */
  async store({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only(['name', 'description', 'color', 'icon', 'parentId'])

    const category = await Category.create({
      companyId,
      ...data,
    })

    return category
  }

  /**
   * Atualiza categoria
   * PUT /api/v1/categories/:id
   */
  async update({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const category = await Category.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    const data = request.only(['name', 'description', 'color', 'icon', 'parentId', 'isActive'])

    category.merge(data)
    await category.save()

    return category
  }

  /**
   * Deleta categoria
   * DELETE /api/v1/categories/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const category = await Category.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    // Verifica se tem produtos
    await category.load('products')
    if (category.products.length > 0) {
      throw new Error('Não é possível excluir categoria com produtos vinculados')
    }

    // Soft delete
    category.isActive = false
    await category.save()

    return response.noContent()
  }
}

import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'
import ProductService from '#services/ProductService'

export default class ProductsController {
  private productService: ProductService

  constructor() {
    this.productService = new ProductService()
  }

  /**
   * Lista produtos com filtros e paginação
   * GET /api/v1/products
   */
  async index({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const {
      page = 1,
      perPage = 20,
      search = '',
      categoryId,
      isActive,
      lowStock,
      expiring,
    } = request.qs()

    const query = Product.query()
      .where('company_id', companyId)
      .preload('category')
      .preload('supplier')

    // Filtros
    if (search) {
      query.where((q) => {
        q.where('name', 'like', `%${search}%`)
          .orWhere('sku', 'like', `%${search}%`)
          .orWhere('barcode', 'like', `%${search}%`)
      })
    }

    if (categoryId) {
      query.where('category_id', categoryId)
    }

    if (isActive !== undefined) {
      query.where('is_active', isActive === 'true')
    }

    if (lowStock === 'true') {
      query.whereRaw('current_stock <= minimum_stock')
    }

    if (expiring === 'true') {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      query.whereNotNull('expiration_date').whereBetween('expiration_date', [new Date(), futureDate])
    }

    const products = await query.orderBy('name', 'asc').paginate(page, perPage)

    return products.serialize()
  }

  /**
   * Busca produto por ID
   * GET /api/v1/products/:id
   */
  async show({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const product = await Product.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .preload('category')
      .preload('supplier')
      .firstOrFail()

    return product
  }

  /**
   * Busca produto por código de barras
   * GET /api/v1/products/barcode/:barcode
   */
  async findByBarcode({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const product = await Product.query()
      .where('barcode', params.barcode)
      .where('company_id', companyId)
      .where('is_active', true)
      .preload('category')
      .firstOrFail()

    return product
  }

  /**
   * Cria novo produto
   * POST /api/v1/products
   */
  async store({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only([
      'sku',
      'barcode',
      'name',
      'description',
      'categoryId',
      'currentStock',
      'minimumStock',
      'maximumStock',
      'unit',
      'unitsPerPackage',
      'costPrice',
      'salePrice',
      'wholesalePrice',
      'ncm',
      'taxPercentage',
      'expirationDate',
      'expirationAlertDays',
      'supplierId',
      'imageUrl',
      'images',
      'metadata',
      'isActive',
      'allowNegativeStock',
      'trackStock',
    ])

    const product = await this.productService.create(companyId, data, user.id)

    return product
  }

  /**
   * Atualiza produto
   * PUT /api/v1/products/:id
   */
  async update({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only([
      'sku',
      'barcode',
      'name',
      'description',
      'categoryId',
      'currentStock',
      'minimumStock',
      'maximumStock',
      'unit',
      'unitsPerPackage',
      'costPrice',
      'salePrice',
      'wholesalePrice',
      'ncm',
      'taxPercentage',
      'expirationDate',
      'expirationAlertDays',
      'supplierId',
      'imageUrl',
      'images',
      'metadata',
      'isActive',
      'allowNegativeStock',
      'trackStock',
      'adjustmentReason',
    ])

    const product = await this.productService.update(params.id, data, user.id, companyId)

    return product
  }

  /**
   * Deleta produto
   * DELETE /api/v1/products/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const product = await Product.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    // Soft delete - apenas desativa
    product.isActive = false
    await product.save()

    return response.noContent()
  }

  /**
   * Importa produtos de CSV/Excel
   * POST /api/v1/products/import
   */
  async import({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { products } = request.only(['products'])

    const results = await this.productService.importFromFile(companyId, products, user.id)

    return {
      success: results.success.length,
      errors: results.errors.length,
      successItems: results.success,
      errorItems: results.errors,
    }
  }

  /**
   * Lista produtos com estoque baixo
   * GET /api/v1/products/low-stock
   */
  async lowStock({ auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const products = await this.productService.getLowStock(companyId)

    return products
  }

  /**
   * Lista produtos vencendo
   * GET /api/v1/products/expiring
   */
  async expiring({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { daysAhead = 30 } = request.qs()

    const products = await this.productService.getExpiring(companyId, parseInt(daysAhead))

    return products
  }

  /**
   * Atualização rápida de preço
   * PATCH /api/v1/products/:id/price
   */
  async updatePrice({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { salePrice, costPrice } = request.only(['salePrice', 'costPrice'])

    const product = await this.productService.update(
      params.id,
      { salePrice, costPrice },
      user.id,
      companyId
    )

    return product
  }

  /**
   * Histórico de movimentações de estoque
   * GET /api/v1/products/:id/movements
   */
  async movements({ params, auth, request }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { page = 1, perPage = 50 } = request.qs()

    const product = await Product.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    const movements = await product
      .related('stockMovements')
      .query()
      .preload('user')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return movements.serialize()
  }
}

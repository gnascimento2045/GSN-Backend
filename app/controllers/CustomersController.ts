import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'

export default class CustomersController {
  /**
   * Lista clientes
   * GET /api/v1/customers
   */
  async index({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { page = 1, perPage = 20, search = '', isActive, allowCredit, isBlocked } = request.qs()

    const query = Customer.query().where('company_id', companyId)

    if (search) {
      query.where((q) => {
        q.where('name', 'like', `%${search}%`)
          .orWhere('document', 'like', `%${search}%`)
          .orWhere('phone', 'like', `%${search}%`)
      })
    }

    if (isActive !== undefined) {
      query.where('is_active', isActive === 'true')
    }

    if (allowCredit !== undefined) {
      query.where('allow_credit', allowCredit === 'true')
    }

    if (isBlocked !== undefined) {
      query.where('is_blocked', isBlocked === 'true')
    }

    const customers = await query.orderBy('name', 'asc').paginate(page, perPage)

    return customers.serialize()
  }

  /**
   * Busca cliente por ID
   * GET /api/v1/customers/:id
   */
  async show({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const customer = await Customer.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .withCount('sales')
      .firstOrFail()

    return customer
  }

  /**
   * Cria cliente
   * POST /api/v1/customers
   */
  async store({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only([
      'name',
      'document',
      'email',
      'phone',
      'mobile',
      'zipCode',
      'street',
      'number',
      'complement',
      'neighborhood',
      'city',
      'state',
      'creditLimit',
      'allowCredit',
      'birthDate',
      'notes',
    ])

    const customer = await Customer.create({
      companyId,
      ...data,
    })

    return customer
  }

  /**
   * Atualiza cliente
   * PUT /api/v1/customers/:id
   */
  async update({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const customer = await Customer.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    const data = request.only([
      'name',
      'document',
      'email',
      'phone',
      'mobile',
      'zipCode',
      'street',
      'number',
      'complement',
      'neighborhood',
      'city',
      'state',
      'creditLimit',
      'allowCredit',
      'isBlocked',
      'birthDate',
      'notes',
      'isActive',
    ])

    customer.merge(data)
    await customer.save()

    return customer
  }

  /**
   * Deleta cliente
   * DELETE /api/v1/customers/:id
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const customer = await Customer.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    // Soft delete
    customer.isActive = false
    await customer.save()

    return response.noContent()
  }

  /**
   * Histórico de compras do cliente
   * GET /api/v1/customers/:id/sales
   */
  async sales({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { page = 1, perPage = 20 } = request.qs()

    const customer = await Customer.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    const sales = await customer
      .related('sales')
      .query()
      .preload('items')
      .orderBy('created_at', 'desc')
      .paginate(page, perPage)

    return sales.serialize()
  }

  /**
   * Vendas fiadas pendentes
   * GET /api/v1/customers/:id/credit-sales
   */
  async creditSales({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const customer = await Customer.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .firstOrFail()

    const creditSales = await customer
      .related('sales')
      .query()
      .where('is_credit_sale', true)
      .whereNull('paid_at')
      .preload('items')
      .orderBy('due_date', 'asc')

    return creditSales
  }

  /**
   * Lista clientes inadimplentes
   * GET /api/v1/customers/overdue
   */
  async overdue({ auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const customers = await Customer.query()
      .where('company_id', companyId)
      .where('is_active', true)
      .where('current_debt', '>', 0)
      .orderBy('current_debt', 'desc')

    return customers
  }
}

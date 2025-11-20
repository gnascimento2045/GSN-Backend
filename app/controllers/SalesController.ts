import type { HttpContext } from '@adonisjs/core/http'
import Sale from '#models/sale'
import SaleService from '#services/SaleService'

export default class SalesController {
  private saleService: SaleService

  constructor() {
    this.saleService = new SaleService()
  }

  /**
   * Lista vendas com filtros e paginação
   * GET /api/v1/sales
   */
  async index({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const {
      page = 1,
      perPage = 20,
      status,
      customerId,
      cashRegisterId,
      userId,
      startDate,
      endDate,
      isCreditSale,
    } = request.qs()

    const query = Sale.query()
      .where('company_id', companyId)
      .preload('customer')
      .preload('user')
      .preload('cashRegister')
      .withCount('items')

    // Filtros
    if (status) {
      query.where('status', status)
    }

    if (customerId) {
      query.where('customer_id', customerId)
    }

    if (cashRegisterId) {
      query.where('cash_register_id', cashRegisterId)
    }

    if (userId) {
      query.where('user_id', userId)
    }

    if (isCreditSale !== undefined) {
      query.where('is_credit_sale', isCreditSale === 'true')
    }

    if (startDate && endDate) {
      query.whereBetween('created_at', [startDate, endDate])
    }

    const sales = await query.orderBy('created_at', 'desc').paginate(page, perPage)

    return sales.serialize()
  }

  /**
   * Busca venda por ID
   * GET /api/v1/sales/:id
   */
  async show({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const sale = await Sale.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .preload('items', (query) => {
        query.preload('product')
      })
      .preload('customer')
      .preload('user')
      .preload('cashRegister')
      .firstOrFail()

    return sale
  }

  /**
   * Cria nova venda (PDV)
   * POST /api/v1/sales
   */
  async store({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only([
      'customerId',
      'cashRegisterId',
      'items',
      'discountAmount',
      'discountPercentage',
      'paidCash',
      'paidPix',
      'paidCredit',
      'paidDebit',
      'changeGiven',
      'isCreditSale',
      'dueDate',
      'notes',
      'pixQrCode',
      'pixTransactionId',
    ])

    const sale = await this.saleService.create(companyId, user.id, data)

    return sale
  }

  /**
   * Cancela venda
   * DELETE /api/v1/sales/:id
   */
  async destroy({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { reason } = request.only(['reason'])

    if (!reason) {
      throw new Error('Motivo do cancelamento é obrigatório')
    }

    const sale = await this.saleService.cancel(params.id, user.id, companyId, reason)

    return sale
  }

  /**
   * Gera QR Code Pix para venda
   * POST /api/v1/sales/generate-pix
   */
  async generatePix({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { amount } = request.only(['amount'])

    if (!amount || amount <= 0) {
      throw new Error('Valor inválido')
    }

    const pixData = await this.saleService.generatePixQrCode(amount, companyId)

    return pixData
  }

  /**
   * Registra pagamento de venda fiada
   * POST /api/v1/sales/:id/pay
   */
  async registerPayment({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { amount, paymentMethod } = request.only(['amount', 'paymentMethod'])

    const sale = await this.saleService.registerPayment(params.id, amount, paymentMethod, companyId)

    return sale
  }

  /**
   * Estatísticas de vendas
   * GET /api/v1/sales/stats
   */
  async stats({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { startDate, endDate } = request.qs()

    const query = Sale.query().where('company_id', companyId).where('status', 'completed')

    if (startDate && endDate) {
      query.whereBetween('created_at', [startDate, endDate])
    }

    const sales = await query.select('*')

    const stats = {
      totalSales: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalCash: sales.reduce((sum, sale) => sum + sale.paidCash, 0),
      totalPix: sales.reduce((sum, sale) => sum + sale.paidPix, 0),
      totalCredit: sales.reduce((sum, sale) => sum + sale.paidCredit, 0),
      salesCount: sales.length,
      averageTicket: sales.length > 0 ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
    }

    return stats
  }
}

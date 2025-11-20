import type { HttpContext } from '@adonisjs/core/http'
import CashRegister from '#models/cash_register'
import CashRegisterService from '#services/CashRegisterService'

export default class CashRegistersController {
  private cashRegisterService: CashRegisterService

  constructor() {
    this.cashRegisterService = new CashRegisterService()
  }

  /**
   * Lista caixas
   * GET /api/v1/cash-registers
   */
  async index({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { page = 1, perPage = 20, status, startDate, endDate } = request.qs()

    const query = CashRegister.query()
      .where('company_id', companyId)
      .preload('user')
      .preload('opener')
      .preload('closer')

    if (status) {
      query.where('status', status)
    }

    if (startDate && endDate) {
      query.whereBetween('opened_at', [startDate, endDate])
    }

    const cashRegisters = await query.orderBy('opened_at', 'desc').paginate(page, perPage)

    return cashRegisters.serialize()
  }

  /**
   * Busca caixa por ID
   * GET /api/v1/cash-registers/:id
   */
  async show({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const cashRegister = await CashRegister.query()
      .where('id', params.id)
      .where('company_id', companyId)
      .preload('user')
      .preload('opener')
      .preload('closer')
      .firstOrFail()

    return cashRegister
  }

  /**
   * Abre novo caixa
   * POST /api/v1/cash-registers/open
   */
  async open({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only(['terminalName', 'terminalNumber', 'openingBalance', 'openingNotes'])

    const cashRegister = await this.cashRegisterService.open(companyId, user.id, data)

    return cashRegister
  }

  /**
   * Fecha caixa
   * POST /api/v1/cash-registers/:id/close
   */
  async close({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only(['closingBalance', 'closingNotes'])

    const cashRegister = await this.cashRegisterService.close(params.id, user.id, companyId, data)

    return cashRegister
  }

  /**
   * Busca caixa aberto atual
   * GET /api/v1/cash-registers/current
   */
  async current({ request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const { terminalNumber } = request.qs()

    const cashRegister = await this.cashRegisterService.getCurrentOpen(
      companyId,
      terminalNumber ? parseInt(terminalNumber) : undefined
    )

    if (!cashRegister) {
      return { message: 'Nenhum caixa aberto encontrado' }
    }

    await cashRegister.load('user')

    return cashRegister
  }

  /**
   * Registra sangria
   * POST /api/v1/cash-registers/:id/withdrawal
   */
  async withdrawal({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only(['amount', 'description', 'notes'])

    const cashRegister = await this.cashRegisterService.withdrawal(
      params.id,
      user.id,
      companyId,
      data
    )

    return cashRegister
  }

  /**
   * Registra suprimento
   * POST /api/v1/cash-registers/:id/deposit
   */
  async deposit({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only(['amount', 'description', 'notes'])

    const cashRegister = await this.cashRegisterService.deposit(params.id, user.id, companyId, data)

    return cashRegister
  }

  /**
   * Registra despesa
   * POST /api/v1/cash-registers/:id/expense
   */
  async expense({ params, request, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const data = request.only(['amount', 'description', 'notes'])

    const cashRegister = await this.cashRegisterService.expense(params.id, user.id, companyId, data)

    return cashRegister
  }

  /**
   * Lista movimentações do caixa
   * GET /api/v1/cash-registers/:id/movements
   */
  async movements({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const movements = await this.cashRegisterService.getMovements(params.id, companyId)

    return movements
  }

  /**
   * Relatório completo do caixa
   * GET /api/v1/cash-registers/:id/report
   */
  async report({ params, auth }: HttpContext) {
    const user = auth.user!
    const companyId = user.companyId!

    const report = await this.cashRegisterService.getReport(params.id, companyId)

    return report
  }
}

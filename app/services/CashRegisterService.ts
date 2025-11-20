import CashRegister from '#models/cash_register'
import CashMovement from '#models/cash_movement'
import { DateTime } from 'luxon'

export default class CashRegisterService {
  /**
   * Abre um novo caixa
   */
  async open(
    companyId: number,
    userId: number,
    data: {
      terminalName: string
      terminalNumber: number
      openingBalance: number
      openingNotes?: string
    }
  ) {
    // Verifica se já existe caixa aberto para este terminal
    const existingOpen = await CashRegister.query()
      .where('company_id', companyId)
      .where('terminal_number', data.terminalNumber)
      .where('status', 'open')
      .first()

    if (existingOpen) {
      throw new Error(
        `Já existe um caixa aberto para o terminal ${data.terminalName}. Feche-o antes de abrir outro.`
      )
    }

    const cashRegister = await CashRegister.create({
      companyId,
      userId,
      terminalName: data.terminalName,
      terminalNumber: data.terminalNumber,
      status: 'open',
      openingBalance: data.openingBalance,
      openedAt: DateTime.now(),
      openedBy: userId,
      openingNotes: data.openingNotes || null,
      totalCash: 0,
      totalPix: 0,
      totalCredit: 0,
      totalSales: 0,
      salesCount: 0,
      totalWithdrawals: 0,
      totalDeposits: 0,
      totalExpenses: 0,
    })

    // Registra movimentação de abertura
    await CashMovement.create({
      companyId,
      cashRegisterId: cashRegister.id,
      userId,
      type: 'opening',
      amount: data.openingBalance,
      paymentMethod: 'cash',
      description: 'Abertura de caixa',
      notes: data.openingNotes || null,
    })

    return cashRegister
  }

  /**
   * Fecha um caixa
   */
  async close(
    cashRegisterId: number,
    userId: number,
    companyId: number,
    data: {
      closingBalance: number
      closingNotes?: string
    }
  ) {
    const cashRegister = await CashRegister.findOrFail(cashRegisterId)

    // Verifica tenant
    if (cashRegister.companyId !== companyId) {
      throw new Error('Caixa não pertence a esta empresa')
    }

    // Verifica se está aberto
    if (!cashRegister.canClose()) {
      throw new Error('Este caixa não pode ser fechado')
    }

    // Calcula saldo esperado
    const expectedBalance = cashRegister.calculateExpectedBalance()

    // Calcula diferença
    const difference = data.closingBalance - expectedBalance

    // Atualiza caixa
    cashRegister.status = 'closed'
    cashRegister.closingBalance = data.closingBalance
    cashRegister.expectedBalance = expectedBalance
    cashRegister.difference = difference
    cashRegister.closedAt = DateTime.now()
    cashRegister.closedBy = userId
    cashRegister.closingNotes = data.closingNotes || null
    await cashRegister.save()

    // Registra movimentação de fechamento
    await CashMovement.create({
      companyId,
      cashRegisterId: cashRegister.id,
      userId,
      type: 'closing',
      amount: data.closingBalance,
      paymentMethod: 'cash',
      description: 'Fechamento de caixa',
      notes: data.closingNotes || null,
    })

    // Se houver diferença significativa, cria notificação
    if (Math.abs(difference) > 5) {
      // Diferença maior que R$ 5
      // TODO: Criar notificação
    }

    return cashRegister
  }

  /**
   * Registra uma sangria (retirada de dinheiro)
   */
  async withdrawal(
    cashRegisterId: number,
    userId: number,
    companyId: number,
    data: {
      amount: number
      description: string
      notes?: string
    }
  ) {
    const cashRegister = await CashRegister.findOrFail(cashRegisterId)

    if (cashRegister.companyId !== companyId) {
      throw new Error('Caixa não pertence a esta empresa')
    }

    if (!cashRegister.isOpen()) {
      throw new Error('Caixa não está aberto')
    }

    // Registra movimentação
    await CashMovement.create({
      companyId,
      cashRegisterId,
      userId,
      type: 'withdrawal',
      amount: data.amount,
      paymentMethod: 'cash',
      description: data.description,
      notes: data.notes || null,
    })

    // Atualiza total de sangrias
    cashRegister.totalWithdrawals += data.amount
    await cashRegister.save()

    return cashRegister
  }

  /**
   * Registra um suprimento (entrada de dinheiro)
   */
  async deposit(
    cashRegisterId: number,
    userId: number,
    companyId: number,
    data: {
      amount: number
      description: string
      notes?: string
    }
  ) {
    const cashRegister = await CashRegister.findOrFail(cashRegisterId)

    if (cashRegister.companyId !== companyId) {
      throw new Error('Caixa não pertence a esta empresa')
    }

    if (!cashRegister.isOpen()) {
      throw new Error('Caixa não está aberto')
    }

    // Registra movimentação
    await CashMovement.create({
      companyId,
      cashRegisterId,
      userId,
      type: 'deposit',
      amount: data.amount,
      paymentMethod: 'cash',
      description: data.description,
      notes: data.notes || null,
    })

    // Atualiza total de suprimentos
    cashRegister.totalDeposits += data.amount
    await cashRegister.save()

    return cashRegister
  }

  /**
   * Registra uma despesa
   */
  async expense(
    cashRegisterId: number,
    userId: number,
    companyId: number,
    data: {
      amount: number
      description: string
      notes?: string
    }
  ) {
    const cashRegister = await CashRegister.findOrFail(cashRegisterId)

    if (cashRegister.companyId !== companyId) {
      throw new Error('Caixa não pertence a esta empresa')
    }

    if (!cashRegister.isOpen()) {
      throw new Error('Caixa não está aberto')
    }

    // Registra movimentação
    await CashMovement.create({
      companyId,
      cashRegisterId,
      userId,
      type: 'expense',
      amount: data.amount,
      paymentMethod: 'cash',
      description: data.description,
      notes: data.notes || null,
    })

    // Atualiza total de despesas
    cashRegister.totalExpenses += data.amount
    await cashRegister.save()

    return cashRegister
  }

  /**
   * Busca caixa aberto atual
   */
  async getCurrentOpen(companyId: number, terminalNumber?: number) {
    const query = CashRegister.query()
      .where('company_id', companyId)
      .where('status', 'open')
      .orderBy('opened_at', 'desc')

    if (terminalNumber) {
      query.where('terminal_number', terminalNumber)
    }

    return await query.first()
  }

  /**
   * Lista movimentações de um caixa
   */
  async getMovements(cashRegisterId: number, companyId: number) {
    const cashRegister = await CashRegister.findOrFail(cashRegisterId)

    if (cashRegister.companyId !== companyId) {
      throw new Error('Caixa não pertence a esta empresa')
    }

    return await CashMovement.query()
      .where('cash_register_id', cashRegisterId)
      .preload('user')
      .preload('sale')
      .orderBy('created_at', 'asc')
  }

  /**
   * Relatório de caixa
   */
  async getReport(cashRegisterId: number, companyId: number) {
    const cashRegister = await CashRegister.findOrFail(cashRegisterId)

    if (cashRegister.companyId !== companyId) {
      throw new Error('Caixa não pertence a esta empresa')
    }

    // Carrega relacionamentos
    await cashRegister.load('user')
    await cashRegister.load('opener')
    await cashRegister.load('closer')
    await cashRegister.load('sales', (query) => {
      query.preload('items')
    })

    const movements = await this.getMovements(cashRegisterId, companyId)

    return {
      cashRegister,
      movements,
      summary: {
        openingBalance: cashRegister.openingBalance,
        totalSales: cashRegister.totalSales,
        totalCash: cashRegister.totalCash,
        totalPix: cashRegister.totalPix,
        totalCredit: cashRegister.totalCredit,
        totalWithdrawals: cashRegister.totalWithdrawals,
        totalDeposits: cashRegister.totalDeposits,
        totalExpenses: cashRegister.totalExpenses,
        expectedBalance: cashRegister.calculateExpectedBalance(),
        closingBalance: cashRegister.closingBalance,
        difference: cashRegister.difference,
        salesCount: cashRegister.salesCount,
      },
    }
  }
}

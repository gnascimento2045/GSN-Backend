import Sale from '#models/sale'
import SaleItem from '#models/sale_item'
import Product from '#models/product'
import Customer from '#models/customer'
import CashRegister from '#models/cash_register'
import CashMovement from '#models/cash_movement'
import ProductService from './ProductService.js'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

export default class SaleService {
  private productService: ProductService

  constructor() {
    this.productService = new ProductService()
  }

  /**
   * Cria uma nova venda completa
   */
  async create(companyId: number, userId: number, data: any) {
    const trx = await db.transaction()

    try {
      // Validações iniciais
      await this.validateSale(companyId, data)

      // Se for fiado, valida cliente
      if (data.isCreditSale) {
        await this.validateCreditSale(data.customerId, data.total, companyId)
      }

      // Calcula totais
      const totals = this.calculateTotals(data.items, data.discountAmount || 0, data.discountPercentage || 0)

      // Cria a venda
      const sale = await Sale.create(
        {
          companyId,
          userId,
          customerId: data.customerId || null,
          cashRegisterId: data.cashRegisterId || null,
          status: 'completed',
          subtotal: totals.subtotal,
          discountAmount: data.discountAmount || 0,
          discountPercentage: data.discountPercentage || 0,
          total: totals.total,
          paidCash: data.paidCash || 0,
          paidPix: data.paidPix || 0,
          paidCredit: data.paidCredit || 0,
          paidDebit: data.paidDebit || 0,
          changeGiven: data.changeGiven || 0,
          isCreditSale: data.isCreditSale || false,
          dueDate: data.dueDate || null,
          notes: data.notes || null,
          pixQrCode: data.pixQrCode || null,
          pixTransactionId: data.pixTransactionId || null,
        },
        { client: trx }
      )

      // Cria itens da venda
      for (const item of data.items) {
        const product = await Product.findOrFail(item.productId)

        // Verifica tenant
        if (product.companyId !== companyId) {
          throw new Error(`Produto ${product.name} não pertence a esta empresa`)
        }

        // Calcula valores do item
        const itemSubtotal = item.quantity * item.unitPrice
        const itemDiscountAmount = item.discountAmount || 0
        const itemTotal = itemSubtotal - itemDiscountAmount

        await SaleItem.create(
          {
            saleId: sale.id,
            productId: product.id,
            productName: product.name,
            productSku: product.sku,
            quantity: item.quantity,
            unit: product.unit,
            unitPrice: item.unitPrice,
            costPrice: product.costPrice,
            discountAmount: itemDiscountAmount,
            discountPercentage: item.discountPercentage || 0,
            subtotal: itemSubtotal,
            total: itemTotal,
          },
          { client: trx }
        )

        // Atualiza estoque
        await this.productService.updateStock(
          product.id,
          item.quantity,
          'sale',
          userId,
          companyId,
          {
            saleId: sale.id,
            totalValue: itemTotal,
          }
        )
      }

      // Registra movimentações no caixa
      if (data.cashRegisterId) {
        await this.registerCashMovements(sale, data.cashRegisterId, userId, companyId, trx)
      }

      // Atualiza saldo do cliente se for fiado
      if (data.isCreditSale && data.customerId) {
        await this.updateCustomerDebt(data.customerId, totals.total, 'add', trx)
      }

      await trx.commit()

      // Carrega relacionamentos
      await sale.load('items')
      await sale.load('customer')
      await sale.load('user')

      return sale
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Cancela uma venda
   */
  async cancel(saleId: number, userId: number, companyId: number, reason: string) {
    const trx = await db.transaction()

    try {
      const sale = await Sale.findOrFail(saleId)

      // Verifica tenant
      if (sale.companyId !== companyId) {
        throw new Error('Venda não pertence a esta empresa')
      }

      // Verifica se pode cancelar
      if (!sale.canCancel()) {
        throw new Error('Esta venda não pode ser cancelada')
      }

      // Carrega itens
      await sale.load('items')

      // Devolve estoque
      for (const item of sale.items) {
        await this.productService.updateStock(
          item.productId,
          item.quantity,
          'return',
          userId,
          companyId,
          {
            saleId: sale.id,
            reason: 'Cancelamento de venda',
          }
        )
      }

      // Estorna fiado
      if (sale.isCreditSale && sale.customerId) {
        await this.updateCustomerDebt(sale.customerId, sale.total, 'subtract', trx)
      }

      // Atualiza venda
      sale.status = 'cancelled'
      sale.cancelledAt = DateTime.now()
      sale.cancelledBy = userId
      sale.cancellationReason = reason
      await sale.save()

      // TODO: Estornar movimentações de caixa (se ainda não fechado)

      await trx.commit()
      return sale
    } catch (error) {
      await trx.rollback()
      throw error
    }
  }

  /**
   * Registra pagamento de venda fiada
   */
  async registerPayment(saleId: number, amount: number, paymentMethod: string, companyId: number) {
    const sale = await Sale.findOrFail(saleId)

    if (sale.companyId !== companyId) {
      throw new Error('Venda não pertence a esta empresa')
    }

    if (!sale.isCreditSale) {
      throw new Error('Esta venda não é fiada')
    }

    // Atualiza venda
    if (paymentMethod === 'cash') {
      sale.paidCash += amount
    } else if (paymentMethod === 'pix') {
      sale.paidPix += amount
    }

    if (sale.getTotalPaid() >= sale.total) {
      sale.paidAt = DateTime.now()
    }

    await sale.save()

    // Atualiza saldo do cliente
    if (sale.customerId) {
      await this.updateCustomerDebt(sale.customerId, amount, 'subtract')
    }

    return sale
  }

  /**
   * Valida venda
   */
  private async validateSale(companyId: number, data: any) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Venda deve ter pelo menos um item')
    }

    // Valida caixa aberto
    if (data.cashRegisterId) {
      const cashRegister = await CashRegister.findOrFail(data.cashRegisterId)
      if (cashRegister.companyId !== companyId) {
        throw new Error('Caixa não pertence a esta empresa')
      }
      if (!cashRegister.isOpen()) {
        throw new Error('O caixa não está aberto')
      }
    }
  }

  /**
   * Valida venda fiada
   */
  private async validateCreditSale(customerId: number, amount: number, companyId: number) {
    if (!customerId) {
      throw new Error('Cliente é obrigatório para venda fiada')
    }

    const customer = await Customer.findOrFail(customerId)

    if (customer.companyId !== companyId) {
      throw new Error('Cliente não pertence a esta empresa')
    }

    if (!customer.hasAvailableCredit(amount)) {
      throw new Error(
        `Cliente não tem crédito suficiente. Limite: R$ ${customer.creditLimit}, Dívida atual: R$ ${customer.currentDebt}, Disponível: R$ ${customer.getRemainingCredit()}`
      )
    }
  }

  /**
   * Calcula totais da venda
   */
  private calculateTotals(items: any[], discountAmount: number, discountPercentage: number) {
    let subtotal = 0

    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice
      const itemDiscount = item.discountAmount || 0
      subtotal += itemSubtotal - itemDiscount
    }

    let total = subtotal

    // Aplica desconto geral
    if (discountPercentage > 0) {
      total = total - (total * discountPercentage) / 100
    }

    if (discountAmount > 0) {
      total = total - discountAmount
    }

    return { subtotal, total }
  }

  /**
   * Registra movimentações no caixa
   */
  private async registerCashMovements(
    sale: Sale,
    cashRegisterId: number,
    userId: number,
    companyId: number,
    trx?: any
  ) {
    // Dinheiro
    if (sale.paidCash > 0) {
      await CashMovement.create(
        {
          companyId,
          cashRegisterId,
          userId,
          saleId: sale.id,
          type: 'sale',
          amount: sale.paidCash,
          paymentMethod: 'cash',
          description: `Venda ${sale.saleNumber}`,
        },
        { client: trx }
      )
    }

    // Pix
    if (sale.paidPix > 0) {
      await CashMovement.create(
        {
          companyId,
          cashRegisterId,
          userId,
          saleId: sale.id,
          type: 'sale',
          amount: sale.paidPix,
          paymentMethod: 'pix',
          description: `Venda ${sale.saleNumber}`,
        },
        { client: trx }
      )
    }

    // Troco
    if (sale.changeGiven > 0) {
      await CashMovement.create(
        {
          companyId,
          cashRegisterId,
          userId,
          saleId: sale.id,
          type: 'change',
          amount: sale.changeGiven,
          paymentMethod: 'cash',
          description: `Troco da venda ${sale.saleNumber}`,
        },
        { client: trx }
      )
    }

    // Atualiza totais do caixa
    const cashRegister = await CashRegister.findOrFail(cashRegisterId)
    cashRegister.totalCash += sale.paidCash - sale.changeGiven
    cashRegister.totalPix += sale.paidPix
    cashRegister.totalCredit += sale.paidCredit
    cashRegister.totalSales += sale.total
    cashRegister.salesCount += 1
    await cashRegister.save()
  }

  /**
   * Atualiza dívida do cliente
   */
  private async updateCustomerDebt(
    customerId: number,
    amount: number,
    operation: 'add' | 'subtract',
    trx?: any
  ) {
    const customer = await Customer.findOrFail(customerId)

    if (operation === 'add') {
      customer.currentDebt += amount
      customer.totalPurchases += amount
      customer.totalOrders += 1
      customer.lastPurchaseAt = DateTime.now()
    } else {
      customer.currentDebt -= amount
    }

    // Bloqueia se atingir limite
    if (customer.shouldBeBlocked()) {
      customer.isBlocked = true
    }

    await customer.save({ client: trx })
  }

  /**
   * Gera QR Code Pix
   */
  async generatePixQrCode(amount: number, companyId: number) {
    // TODO: Implementar geração de Pix com biblioteca pix-payload
    // Aqui você conectaria com sua API de pagamentos ou geraria o payload Pix

    const pixKey = 'sua-chave-pix@email.com' // Buscar das configurações da empresa
    const merchantName = 'Sua Empresa' // Buscar do Company
    const merchantCity = 'SAO PAULO'
    const txid = `VENDA${Date.now()}`

    // Exemplo simplificado - implementar com biblioteca correta
    const pixPayload = {
      pixKey,
      merchantName,
      merchantCity,
      amount: amount.toFixed(2),
      txid,
    }

    return {
      qrCode: `mock-qr-code-${txid}`, // QR Code base64
      payload: JSON.stringify(pixPayload),
      txid,
    }
  }
}

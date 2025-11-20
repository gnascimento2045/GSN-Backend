import Product from '#models/product'
import StockMovement from '#models/stock_movement'
import Notification from '#models/notification'
import { DateTime } from 'luxon'

export default class ProductService {
  /**
   * Cria produto com geração automática de SKU
   */
  async create(companyId: number, data: any, userId: number) {
    // Gera SKU se não fornecido
    if (!data.sku) {
      data.sku = await this.generateSku(companyId)
    }

    // Calcula margem de lucro
    if (data.costPrice && data.salePrice) {
      data.profitMargin = ((data.salePrice - data.costPrice) / data.salePrice) * 100
    }

    const product = await Product.create({
      companyId,
      ...data,
    })

    // Registra estoque inicial se fornecido
    if (data.currentStock && data.currentStock > 0) {
      await StockMovement.create({
        companyId,
        productId: product.id,
        userId,
        type: 'initial',
        quantity: data.currentStock,
        previousStock: 0,
        newStock: data.currentStock,
        unitCost: data.costPrice,
        reason: 'Estoque inicial',
      })
    }

    return product
  }

  /**
   * Atualiza produto
   */
  async update(productId: number, data: any, userId: number, companyId: number) {
    const product = await Product.findOrFail(productId)

    // Verifica tenant
    if (product.companyId !== companyId) {
      throw new Error('Produto não pertence a esta empresa')
    }

    // Se alterou estoque manualmente, registra movimentação
    if (data.currentStock !== undefined && data.currentStock !== product.currentStock) {
      const difference = data.currentStock - product.currentStock
      await StockMovement.create({
        companyId,
        productId: product.id,
        userId,
        type: 'adjustment',
        quantity: Math.abs(difference),
        previousStock: product.currentStock,
        newStock: data.currentStock,
        reason: data.adjustmentReason || 'Ajuste manual de estoque',
      })
    }

    // Recalcula margem
    if (data.costPrice || data.salePrice) {
      const costPrice = data.costPrice || product.costPrice
      const salePrice = data.salePrice || product.salePrice
      data.profitMargin = ((salePrice - costPrice) / salePrice) * 100
    }

    product.merge(data)
    await product.save()

    return product
  }

  /**
   * Atualiza estoque após venda
   */
  async updateStock(
    productId: number,
    quantity: number,
    type: 'sale' | 'purchase' | 'adjustment' | 'loss' | 'return',
    userId: number,
    companyId: number,
    metadata?: any
  ) {
    const product = await Product.findOrFail(productId)

    if (product.companyId !== companyId) {
      throw new Error('Produto não pertence a esta empresa')
    }

    if (!product.trackStock) {
      return product // Não rastreia estoque
    }

    const previousStock = product.currentStock
    let newStock = previousStock

    // Calcula novo estoque
    if (type === 'sale' || type === 'loss') {
      newStock = previousStock - quantity
    } else if (type === 'purchase' || type === 'return') {
      newStock = previousStock + quantity
    } else if (type === 'adjustment') {
      newStock = quantity
    }

    // Verifica estoque negativo
    if (newStock < 0 && !product.allowNegativeStock) {
      throw new Error(`Estoque insuficiente para o produto ${product.name}`)
    }

    // Atualiza produto
    product.currentStock = newStock
    await product.save()

    // Registra movimentação
    await StockMovement.create({
      companyId,
      productId: product.id,
      userId,
      type,
      quantity,
      previousStock,
      newStock,
      unitCost: product.costPrice,
      unitPrice: product.salePrice,
      ...metadata,
    })

    // Verifica estoque baixo e cria notificação
    if (product.isLowStock()) {
      await this.createLowStockNotification(product, companyId)
    }

    return product
  }

  /**
   * Importa produtos de Excel/CSV
   */
  async importFromFile(companyId: number, products: any[], userId: number) {
    const results = {
      success: [] as any[],
      errors: [] as any[],
    }

    for (const productData of products) {
      try {
        const product = await this.create(companyId, productData, userId)
        results.success.push(product)
      } catch (error: any) {
        results.errors.push({
          data: productData,
          error: error.message,
        })
      }
    }

    return results
  }

  /**
   * Lista produtos com estoque baixo
   */
  async getLowStock(companyId: number) {
    return await Product.query()
      .where('company_id', companyId)
      .where('is_active', true)
      .whereRaw('current_stock <= minimum_stock')
      .orderBy('current_stock', 'asc')
  }

  /**
   * Lista produtos vencendo
   */
  async getExpiring(companyId: number, daysAhead: number = 30) {
    const futureDate = DateTime.now().plus({ days: daysAhead })

    return await Product.query()
      .where('company_id', companyId)
      .where('is_active', true)
      .whereNotNull('expiration_date')
      .whereBetween('expiration_date', [DateTime.now().toSQLDate(), futureDate.toSQLDate()])
      .orderBy('expiration_date', 'asc')
  }

  /**
   * Gera SKU automático
   */
  private async generateSku(companyId: number): Promise<string> {
    const count = await Product.query().where('company_id', companyId).count('* as total')
    const number = (count[0].$extras.total + 1).toString().padStart(6, '0')
    return `PRD${number}`
  }

  /**
   * Cria notificação de estoque baixo
   */
  private async createLowStockNotification(product: Product, companyId: number) {
    // Verifica se já existe notificação recente (últimas 24h)
    const existingNotification = await Notification.query()
      .where('company_id', companyId)
      .where('entity_type', 'product')
      .where('entity_id', product.id)
      .where('type', 'low_stock')
      .where('created_at', '>', DateTime.now().minus({ hours: 24 }).toSQL())
      .first()

    if (existingNotification) return

    await Notification.create({
      companyId,
      type: 'low_stock',
      priority: 'high',
      title: 'Estoque Baixo',
      message: `O produto "${product.name}" está com estoque baixo: ${product.currentStock} ${product.unit}`,
      actionUrl: `/products/${product.id}`,
      actionLabel: 'Ver Produto',
      entityType: 'product',
      entityId: product.id,
    })
  }
}

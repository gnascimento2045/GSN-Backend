import Company from '#models/company'
import User from '#models/user'
import { DateTime } from 'luxon'

export default class CompanyService {
  /**
   * Cria uma nova empresa com usuário owner
   */
  async createWithOwner(data: {
    company: {
      name: string
      document: string
      email: string
      phone?: string
    }
    owner: {
      name: string
      email: string
      password: string
      phone?: string
    }
  }) {
    // Cria a empresa
    const company = await Company.create({
      name: data.company.name,
      document: data.company.document,
      email: data.company.email,
      phone: data.company.phone,
      plan: 'free',
      status: 'trial',
      trialEndsAt: DateTime.now().plus({ days: 30 }),
      maxUsers: 3,
      maxProducts: 1000,
      maxMonthlySales: 500,
    })

    // Cria o usuário owner
    const owner = await User.create({
      companyId: company.id,
      name: data.owner.name,
      email: data.owner.email,
      password: data.owner.password,
      phone: data.owner.phone,
      role: 'owner',
      isActive: true,
      isAdmin: true,
    })

    return { company, owner }
  }

  /**
   * Atualiza informações da empresa
   */
  async update(companyId: number, data: Partial<Company>) {
    const company = await Company.findOrFail(companyId)
    company.merge(data)
    await company.save()
    return company
  }

  /**
   * Verifica limites do plano
   */
  async checkLimits(companyId: number) {
    const company = await Company.findOrFail(companyId)

    const [usersCount, productsCount, monthlySales] = await Promise.all([
      User.query().where('company_id', companyId).where('is_active', true).count('* as total'),
      Company.query()
        .join('products', 'products.company_id', 'companies.id')
        .where('companies.id', companyId)
        .where('products.is_active', true)
        .count('products.id as total'),
      Company.query()
        .join('sales', 'sales.company_id', 'companies.id')
        .where('companies.id', companyId)
        .whereBetween('sales.created_at', [
          DateTime.now().startOf('month').toSQL(),
          DateTime.now().endOf('month').toSQL(),
        ])
        .count('sales.id as total'),
    ])

    return {
      users: {
        current: usersCount[0].$extras.total,
        max: company.maxUsers,
        available: company.maxUsers - usersCount[0].$extras.total,
      },
      products: {
        current: productsCount[0].$extras.total,
        max: company.maxProducts,
        available: company.maxProducts - productsCount[0].$extras.total,
      },
      sales: {
        current: monthlySales[0].$extras.total,
        max: company.maxMonthlySales,
        available: company.maxMonthlySales - monthlySales[0].$extras.total,
      },
    }
  }

  /**
   * Verifica se a empresa está ativa e dentro do trial/assinatura
   */
  async isActive(companyId: number): Promise<boolean> {
    const company = await Company.findOrFail(companyId)

    if (!company.isActive) return false
    if (company.status === 'suspended') return false

    if (company.status === 'trial') {
      if (company.trialEndsAt && company.trialEndsAt < DateTime.now()) {
        return false
      }
    }

    if (company.subscriptionEndsAt && company.subscriptionEndsAt < DateTime.now()) {
      return false
    }

    return true
  }
}

import BaseController from '#controllers/BaseController'
import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController extends BaseController {
  constructor() {

  }

  async index(ctx: HttpContext) {
    try {
      const user = await ctx.auth.getUserOrFail()
      const stats = {
        usersCount: 0,
        recentActivities: [],
      }

      return ctx.response.ok({
        success: true,
        message: 'Dados do dashboard',
        data: { user, stats },
      })
    } catch (error: any) {
      return ctx.response.unauthorized({
        success: false,
        message: 'Não autorizado',
        error: error.message,
      })
    }
  }
}

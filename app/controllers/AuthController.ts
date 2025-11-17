import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class AuthController {
  async register({ request, response }: HttpContext) {
    try {
      const data = request.only(['name', 'email', 'password'])

      const existingUser = await User.findBy('email', data.email)
      if (existingUser) {
        return response.status(400).json({
          message: 'Email já cadastrado',
        })
      }

      const user = await User.create(data)

      return response.status(201).json({
        message: 'Usuário cadastrado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Erro ao cadastrar usuário',
        error: error.message,
      })
    }
  }

  async login({ request, response }: HttpContext) {
    try {
      const { email, password } = request.only(['email', 'password'])

      const user = await User.findBy('email', email)
      if (!user) {
        return response.status(400).json({
          message: 'Credenciais inválidas',
        })
      }

      const isPasswordValid = await hash.verify(user.password, password)
      if (!isPasswordValid) {
        return response.status(400).json({
          message: 'Credenciais inválidas',
        })
      }

      return response.status(200).json({
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Erro ao fazer login',
        error: error.message,
      })
    }
  }
}

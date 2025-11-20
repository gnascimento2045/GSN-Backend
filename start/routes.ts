/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/AuthController')
const UsersController = () => import('#controllers/UsersController')
const DashboardController = () => import('#controllers/DashboardController')
const ProductsController = () => import('#controllers/ProductsController')
const CategoriesController = () => import('#controllers/CategoriesController')
const SalesController = () => import('#controllers/SalesController')
const CashRegistersController = () => import('#controllers/CashRegistersController')
const CustomersController = () => import('#controllers/CustomersController')

// Rotas públicas de autenticação (sem prefixo)
router.post('/register', [AuthController, 'register'])
router.post('/login', [AuthController, 'login'])

// Rotas autenticadas (sem prefixo)
router.group(() => {
  router.post('/logout', [AuthController, 'logout'])
  router.get('/me', [AuthController, 'me'])
}).use(middleware.auth())

// Rotas da API com prefixo /api/v1
router.group(() => {
  // Rotas autenticadas
  router.group(() => {
    // Dashboard
    router.get('/dashboard', [DashboardController, 'index'])

    // Auth extras
    router.post('/refresh', [AuthController, 'refresh'])

    // Perfil do usuário
    router.get('/profile', [UsersController, 'profile'])
    router.put('/profile', [UsersController, 'updateProfile'])
    router.post('/profile/avatar', [UsersController, 'uploadAvatar'])
    router.put('/profile/password', [UsersController, 'changePassword'])

    // Usuários (apenas admin/manager)
    router.get('/users', [UsersController, 'index'])
    router.get('/users/paginate', [UsersController, 'paginate'])
    router.get('/users/:id', [UsersController, 'show'])
    router.post('/users', [UsersController, 'store'])
    router.put('/users/:id', [UsersController, 'update'])
    router.delete('/users/:id', [UsersController, 'destroy'])

    // Categorias
    router.get('/categories', [CategoriesController, 'index'])
    router.get('/categories/:id', [CategoriesController, 'show'])
    router.post('/categories', [CategoriesController, 'store'])
    router.put('/categories/:id', [CategoriesController, 'update'])
    router.delete('/categories/:id', [CategoriesController, 'destroy'])

    // Produtos
    router.get('/products', [ProductsController, 'index'])
    router.get('/products/low-stock', [ProductsController, 'lowStock'])
    router.get('/products/expiring', [ProductsController, 'expiring'])
    router.get('/products/barcode/:barcode', [ProductsController, 'findByBarcode'])
    router.get('/products/:id', [ProductsController, 'show'])
    router.post('/products', [ProductsController, 'store'])
    router.post('/products/import', [ProductsController, 'import'])
    router.put('/products/:id', [ProductsController, 'update'])
    router.patch('/products/:id/price', [ProductsController, 'updatePrice'])
    router.delete('/products/:id', [ProductsController, 'destroy'])
    router.get('/products/:id/movements', [ProductsController, 'movements'])

    // Clientes
    router.get('/customers', [CustomersController, 'index'])
    router.get('/customers/overdue', [CustomersController, 'overdue'])
    router.get('/customers/:id', [CustomersController, 'show'])
    router.get('/customers/:id/sales', [CustomersController, 'sales'])
    router.get('/customers/:id/credit-sales', [CustomersController, 'creditSales'])
    router.post('/customers', [CustomersController, 'store'])
    router.put('/customers/:id', [CustomersController, 'update'])
    router.delete('/customers/:id', [CustomersController, 'destroy'])

    // Vendas (PDV)
    router.get('/sales', [SalesController, 'index'])
    router.get('/sales/stats', [SalesController, 'stats'])
    router.get('/sales/:id', [SalesController, 'show'])
    router.post('/sales', [SalesController, 'store'])
    router.post('/sales/generate-pix', [SalesController, 'generatePix'])
    router.post('/sales/:id/pay', [SalesController, 'registerPayment'])
    router.delete('/sales/:id', [SalesController, 'destroy'])

    // Caixa
    router.get('/cash-registers', [CashRegistersController, 'index'])
    router.get('/cash-registers/current', [CashRegistersController, 'current'])
    router.get('/cash-registers/:id', [CashRegistersController, 'show'])
    router.get('/cash-registers/:id/movements', [CashRegistersController, 'movements'])
    router.get('/cash-registers/:id/report', [CashRegistersController, 'report'])
    router.post('/cash-registers/open', [CashRegistersController, 'open'])
    router.post('/cash-registers/:id/close', [CashRegistersController, 'close'])
    router.post('/cash-registers/:id/withdrawal', [CashRegistersController, 'withdrawal'])
    router.post('/cash-registers/:id/deposit', [CashRegistersController, 'deposit'])
    router.post('/cash-registers/:id/expense', [CashRegistersController, 'expense'])

  }).use(middleware.auth())

}).prefix('/api/v1')

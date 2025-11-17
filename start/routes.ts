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
//add dashboard controller
const DashboardController = () => import('#controllers/DashboardController')

router.group(() => {
  router.post('/register', [AuthController, 'register'])
  router.post('/login', [AuthController, 'login'])

  router.group(() => {
    router.get('/dashboard', [DashboardController, 'index'])

    router.post('/logout', [AuthController, 'logout'])
    router.get('/me', [AuthController, 'me'])
    router.post('/refresh', [AuthController, 'refresh'])

    router.get('/profile', [UsersController, 'profile'])
    router.put('/profile', [UsersController, 'updateProfile'])
    router.post('/profile/avatar', [UsersController, 'uploadAvatar'])
    router.put('/profile/password', [UsersController, 'changePassword'])

    router.get('/users', [UsersController, 'index'])
    router.get('/users/paginate', [UsersController, 'paginate'])
    router.get('/users/:id', [UsersController, 'show'])
    router.post('/users', [UsersController, 'store'])
    router.put('/users/:id', [UsersController, 'update'])
    router.delete('/users/:id', [UsersController, 'destroy'])
  }).use(middleware.auth())

}).prefix('/api/v1')

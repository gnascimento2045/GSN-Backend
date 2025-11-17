/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
const AuthController = () => import('../app/controllers/AuthController.js')

router.post('/register', [AuthController, 'register'])
router.post('/login', [AuthController, 'login'])

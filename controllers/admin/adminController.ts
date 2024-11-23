import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'
import { adminUserRouter } from './adminUserController'

export const adminRouter = express.Router()

adminRouter.use(isLoggedIn)
adminRouter.use(isAdmin)

adminRouter.get('/', async (req, res) => {
  const { user } = res.locals;
  render(res, "admin", { 
    username: user?.username, 
    displayName: user?.displayName || user?.username 
  })
})
adminRouter.use('/users', adminUserRouter)

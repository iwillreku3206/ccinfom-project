import express, { type Request, type Response } from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import mustache from 'mustache'
import UserModel from '../../models/user'
import { loadTemplate } from '../../util/loadTemplate'

export const adminRouter = express.Router()

adminRouter.use(isLoggedIn)
adminRouter.use(isAdmin)

adminRouter.get('/', async (req, res) => {
  const { user } = res.locals;
  
  res.send(mustache.render(await loadTemplate("admin"), { 
    username: user?.username, 
    displayName: user?.displayName || user?.username 
  }))
})

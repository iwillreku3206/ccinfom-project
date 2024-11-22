import express from 'express'
import { render } from '../util/io'
import UserModel from '../models/user'
import { isLoggedIn } from '../util/plugins'

export const rootRouter = express.Router()

rootRouter.get('/', async (req, res) => {
  const user = await UserModel.instance.getUserBySession(req.cookies?.session || '')
  if (user != null) return res.redirect("/home")
  render(res, 'index', {})
})

rootRouter.get('/home', isLoggedIn, async (req, res) => {
  const user = res.locals.user;
  
  render(res, 'home', { 
    username: user?.username, 
    displayName: user?.displayName || user?.username, 
    admin: user.userType === "admin" 
  })
})

import express from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import UserModel from '../models/user'
import { isLoggedIn } from './authController'

export const rootRouter = express.Router()

rootRouter.get('/', async (req, res) => {
  const user = await UserModel.instance.getUserBySession(req.cookies?.session || '' )
  if (user != null) return res.redirect("/home")
  res.send(mustache.render(await loadTemplate("index"), {}))
})

rootRouter.get('/home', isLoggedIn, async (req, res) => {
  const user = res.locals.user;
  res.send(mustache.render(await loadTemplate("home"), { username: user?.username, displayName: user?.displayName || user?.username }))
})

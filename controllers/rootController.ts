import express from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import { User } from '../models/user'
import { isLoggedIn } from './authController'

export const rootRouter = express.Router()

rootRouter.get('/', async (req, res) => {
  const user = (await User.execute('get-by-session', { sessionId: req.cookies?.session || '' }))[0]
  if (user != null) return res.redirect("/home")
  res.send(mustache.render(await loadTemplate("index"), {}))
})

rootRouter.get('/home', isLoggedIn, async (req, res) => {
  const user = res.locals.user;
  res.send(mustache.render(await loadTemplate("home"), { username: user?.username, displayName: user?.displayName || user?.username }))
})

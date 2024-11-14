import express from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import { getUserBySession } from '../models/user'

export const rootRouter = express.Router()

rootRouter.get('/', async (req, res) => {
  const user = await getUserBySession(req.cookies?.session)
  if (user != null) return res.redirect("/home")
  res.send(mustache.render(await loadTemplate("index"), {}))
})

rootRouter.get('/home', async (req, res) => {
  const user = await getUserBySession(req.cookies?.session || '')

  res.send(mustache.render(await loadTemplate("home"), {}))
})

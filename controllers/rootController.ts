import express from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import { getUserBySession } from '../models/user'

export const rootRouter = express.Router()

rootRouter.get('/', async (_req, res) => {
  res.send(mustache.render(await loadTemplate("index"), {}))
})

rootRouter.get('/home', async (req, res) => {
  console.log(req)
  const user = await getUserBySession(req.cookies?.session || '')

  res.send("Logged in as" + user?.username)
})

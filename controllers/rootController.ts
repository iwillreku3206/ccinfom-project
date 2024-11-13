import express from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'

const router = express.Router()

export const rootRouter = router.get('/', async (_req, res) => {
  res.send(mustache.render(await loadTemplate("index"), {}))
})

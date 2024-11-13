import express, { type NextFunction, type Request, type Response } from 'express'
import log from 'log'
import { loadTemplate } from '../util/loadTemplate'
import mustache from 'mustache'
import { authRouter } from '../controllers/authController'
import { rootRouter } from '../controllers/rootController'

export const app = express()

function logger(req: Request, _res: Response, next: NextFunction) {
  log.info(`${req.method}: ${req.path}`)
  next()
}

app.use(logger)
app.use(express.urlencoded({}))
app.use(express.static("public"))

app.use("/auth", authRouter)
app.use("/", rootRouter)

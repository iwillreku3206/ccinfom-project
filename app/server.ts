import express, { type NextFunction, type Request, type Response } from 'express'
import log from 'log'
import { authRouter } from '../controllers/authController'
import { rootRouter } from '../controllers/rootController'
import cookieParser from 'cookie-parser'
import { profileRouter } from '../controllers/profileController'
import { gameRouter } from '../controllers/gamesController'
import { listingRouter } from '../controllers/listingController'
import { userInvItemsRouter } from '../controllers/uiiController'
import { adminRouter } from '../controllers/adminController'

export const app = express()

function logger(req: Request, _res: Response, next: NextFunction) {
  log.info(`${req.method}: ${req.path}`)
  next()
}

app.use(logger)
app.use(express.urlencoded({}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/auth", authRouter)
app.use("/admin", adminRouter)
app.use("/", rootRouter)
app.use("/profile", profileRouter)
app.use("/games", gameRouter)
app.use("/listing", listingRouter)
app.use("/userinventoryitems", userInvItemsRouter)

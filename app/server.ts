import express, { type NextFunction, type Request, type Response } from 'express'
import bodyParser from 'body-parser'
import log from 'log'
import { authRouter } from '../controllers/auth/authController'
import { rootRouter } from '../controllers/rootController'
import cookieParser from 'cookie-parser'
import { profileRouter } from '../controllers/model/profileController'
import { gameRouter } from '../controllers/model/gamesController'
import { listingRouter } from '../controllers/model/listingController'
import { inventoryRouter } from '../controllers/model/inventoryController'
import { adminRouter } from '../controllers/admin/adminController'
import { itemRouter } from '../controllers/model/itemController'

export const app = express()

function logger(req: Request, _res: Response, next: NextFunction) {
  log.info(`${req.method}: ${req.path}`)
  next()
}

app.use(express.json());
app.use(bodyParser.urlencoded({
  extended: true
}));


app.use(logger)
app.use(express.urlencoded({}))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/auth", authRouter)
app.use("/admin", adminRouter)
app.use("/", rootRouter)
app.use("/profile", profileRouter)
app.use("/game", gameRouter)
app.use("/listing", listingRouter)
app.use("/item", itemRouter)
app.use("/inventory", inventoryRouter)

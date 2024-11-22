import express, { type Request, type Response } from 'express'
import { isLoggedIn } from './plugins'
import UserModel from '../models/user'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'

export const profileRouter = express.Router()

profileRouter.get('/update', isLoggedIn, async (req: Request, res: Response) => {
  const user = res.locals.user;

  let error = req.query.error?.toString() ?? ''

  res.send(mustache.render(await loadTemplate("updateProfile"), {
    username: user?.username,
    displayName: user?.displayName,
    error
  }))
})

// HTML forms do not support PUT/PATCH
profileRouter.post('/update', isLoggedIn, async (req: Request, res: Response) => {
  try {
    await UserModel.instance.updateProfileBySession({ sessionId: req.cookies.session, username: req.body.username, displayName: req.body.displayName })
  } catch (error) {
    return res.redirect("/profile/update?error=" + error)
  }
  return res.redirect("/home")
})

profileRouter.get("/", isLoggedIn, async (req, res) => {
  const user = res.locals.user;

  let error = req.query.error?.toString() ?? ''

  res.send(mustache.render(await loadTemplate("viewProfile1"), {
    username: user?.username,
    displayName: user?.displayName,
    error
  }))
})

import express, { type Request, type Response } from 'express'
import { isLoggedIn } from './authController'
import { getUserBySession, updateUserProfileBySession } from '../models/user'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'

export const profileRouter = express.Router()

profileRouter.get('/update', isLoggedIn, async (req: Request, res: Response) => {
  const user = await getUserBySession(req.cookies?.session || '')

  let error = ""

  if (req.query.error) {
    error = req.query.error.toString()
  }

  res.send(mustache.render(await loadTemplate("updateProfile"), {
    username: user?.username,
    displayName: user?.displayName,
    error
  }))
})

// HTML forms do not support PUT/PATCH
profileRouter.post('/update', isLoggedIn, async (req: Request, res: Response) => {
  try {
    await updateUserProfileBySession(req.cookies.session, req.body.username, req.body.displayName)
  } catch (error) {
    return res.redirect("/profile/update?error=" + error)
  }
  return res.redirect("/home")
})

import express, { type Request, type Response } from 'express'
import { isLoggedIn, modelHandler } from '../../util/plugins'
import UserModel from '../../models/user'
import { render } from '../../util/io'

export const profileRouter = express.Router()

profileRouter.use(isLoggedIn)
profileRouter.use(modelHandler(UserModel.instance))

profileRouter.get('/update', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;

  render(res, "updateProfile", {
    username: user?.username,
    displayName: user?.displayName,
    error
  })
})

// HTML forms do not support PUT/PATCH
profileRouter.post('/update', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;

  try {
    await model.updateProfileBySession({ 
      sessionId: req.cookies.session, 
      username: req.body.username, 
      displayName: req.body.displayName 
    })
  } catch (error) {
    return res.redirect("/profile/update?error=" + error)
  }
  return res.redirect("/home")
})

profileRouter.get("/", async (req, res) => {
  const { user, model, error } = res.locals;

  render(res, "viewProfile1", {
    username: user?.username,
    displayName: user?.displayName,
    error
  })
})

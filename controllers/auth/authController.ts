import express, { type NextFunction, type Request, type Response } from 'express'
import UserModel from '../../models/user'
import mustache from 'mustache'
import { loadTemplate } from '../../util/loadTemplate'
import argon2 from 'argon2'
import SessionModel from '../../models/session'
import { isLoggedIn, errorHandler } from '../../util/plugins'

export const authRouter = express.Router()

// Specify how to describe errors
const authErrorHandler = errorHandler(new Map([
  [ 'missingfields', 'Please ensure you have a username and password.' ],
  [ 'noaccount', 'Incorrect username/password' ]
]))

authRouter.get('/register', authErrorHandler, async (req, res) => {
  const { error } = res.locals;
  res.send(mustache.render(await loadTemplate("register"), { error }))
})

authRouter.get('/login', authErrorHandler, async (req, res) => {
  const { error } = res.locals;
  res.send(mustache.render(await loadTemplate("login"), { error }))
})

authRouter.post('/logout', async (req, res) => {
  await SessionModel.instance.expireSession(req.cookies?.session || '')
  res.clearCookie("session").redirect("/")
})

authRouter.post('/register', async (req, res) => {
  if (!req.body.username || !req.body.password)
    return res.redirect("/auth/register?error=missingfields")

  if (!req.body.displayName)
    req.body.displayName = req.body.username

  const passwordHash = await argon2.hash(req.body.password)

  try {
    // this can error out
    await UserModel.instance.createUser({
      username: req.body.username,
      passwordHash,
      displayName: req.body.displayName,
      userType: 'basic'
    })
    return res.redirect("/auth/login")
  } catch (error) {
    return res.status(500).redirect("/auth/register?error=" + error)
  }
})

authRouter.post('/login', async (req, res) => {
  if (!req.body.username || !req.body.password)
    return res.redirect('/auth/login?error=missingfields')

  try {
    // this can error out
    const user = await UserModel.instance.getUserByUsername(req.body.username)

    if (!user)
      return res.redirect('/auth/login?error=noaccount')

    const passOk = await argon2.verify(user.passwordHash, req.body.password)

    // we return the same error for security reasons
    if (!passOk)
      return res.redirect('/auth/login?error=noaccount')

    const userAgent = req.headers['user-agent'] || ''

    // password is ok, we create the session
    const { id, expiry } = await SessionModel.instance.createSession(user.id, userAgent)

    return res.cookie("session", id, {
      httpOnly: true,
      expires: expiry
    }).redirect("/home")
  } catch (error) {
    return res.redirect("/auth/login?error=" + error)
  }
})

authRouter.post('/password/update', isLoggedIn, async (req, res) => {
  try {
    await UserModel.instance.updatePasswordBySession(req.cookies.session, req.body.password);
  } catch (error) {
    return res.redirect("/profile/update?error=" + error)
  }
  return res.redirect("/home")
})

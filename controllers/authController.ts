import express, { type NextFunction, type Request, type Response } from 'express'
import UserModel from '../models/user'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import argon2 from 'argon2'
import crypto from 'crypto'
import SessionModel from '../models/session'
import UAParser from 'ua-parser-js'
import log from 'log'

export const authRouter = express.Router()

authRouter.get('/register', async (req, res) => {
  // allows errors to show up on page
  let viewOpts = { error: '' }
  if (req.query.error == "missingfields") {
    viewOpts.error = `Error: Please ensure you have a username and password`
  } else if (req.query.error) {
    viewOpts.error = req.query.error.toString()
  }
  res.send(mustache.render(await loadTemplate("register"), viewOpts))
})

authRouter.post<{}, {}, { username?: string, password?: string, displayName?: string }>('/register', async (req, res) => {
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

authRouter.get('/login', async (req, res) => {
  let viewOpts = { error: '' }

  // allows errors to be shown on the page
  if (req.query.error == "missingfields") {
    viewOpts.error = `Error: Please ensure you have a username and password`
  } else if (req.query.error == "noaccount") {
    viewOpts.error = `Error: Incorrect username/password`
  } else if (req.query.error) {
    viewOpts.error = req.query.error.toString()
  }

  res.send(mustache.render(await loadTemplate("login"), viewOpts))
})

authRouter.post<{}, {}, { username?: string, password?: string }>('/login', async (req, res) => {
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

authRouter.post('/logout', async (req, res) => {
  await SessionModel.instance.expireSession(req.cookies?.session || '')
  res.clearCookie("session").redirect("/")
})

authRouter.post('/password/update', isLoggedIn, async (req, res) => {
  try {
    await UserModel.instance.updatePasswordBySession(req.cookies.session, req.body.password);
  } catch (error) {
    return res.redirect("/profile/update?error=" + error)
  }
  return res.redirect("/home")
})


export async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  const user = await UserModel.instance.getUserBySession(req.cookies.session)
  if (!user) return res.clearCookie('session').redirect('/')

  // Save the user here so we don't have to find it each time
  res.locals.user = user;
  res.locals.error = req.query.error?.toString() ?? '';
  next()
}

export function isAdmin(callback: string) {
  return async (_: Request, res: Response, next: NextFunction) => {
    if (!res.locals.user) log.error("Run isLoggedIn first!")

    console.log("type", res.locals.user)
    if (res.locals.user.userType === 'admin') {
      return next()
    } else {
      return res.redirect(`${callback}?error=unauthorized`)
    }
  }
}

import express, { type NextFunction, type Request, type Response } from 'express'
import { User } from '../models/user'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import argon2 from 'argon2'
import { createSession, expireSession, type Session } from '../models/session'

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
    await User.execute('create', {
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
    const user = (await User.execute('get-by-username', { username: req.body.username }))[0]

    if (!user)
      return res.redirect('/auth/login?error=noaccount')

    const passOk = await argon2.verify(user.passwordHash, req.body.password)

    // we return the same error for security reasons
    if (!passOk)
      return res.redirect('/auth/login?error=noaccount')

    // password is ok, we create the session
    const session = await createSession(user.id, req.headers['user-agent'] || '')
    return res.cookie("session", session.id, {
      httpOnly: true,
      expires: session.expiry
    }).redirect("/home")
  } catch (error) {
    return res.redirect("/auth/login?error=" + error)
  }
})

authRouter.post('/logout', async (req, res) => {
  await expireSession(req.cookies?.session)
  res.clearCookie("session").redirect("/")
})

authRouter.post('/password/update', isLoggedIn, async (req, res) => {

  const passwordHash = await argon2.hash(req.body.password)

  try {
    await User.execute('update-password-by-session', { sessionId: req.cookies.session, passwordHash });
  } catch (error) {
    return res.redirect("/profile/update?error=" + error)
  }
  return res.redirect("/home")
})


export async function isLoggedIn(req: Request, res: Response, next: NextFunction) {
  const user = (await User.execute('get-by-session', { sessionId: req.cookies?.session || '' }))[0]
  if (!user) return res.clearCookie('session').redirect('/')
  
  // Save the user here so we don't have to find it each time
  res.locals.user = user;
  res.locals.error = req.query.error?.toString() ?? '';
  next()
}

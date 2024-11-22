import express, { type NextFunction, type Request, type Response } from 'express'
import { createErrorHandler, isLoggedIn } from './authController'
import UserModel from '../models/user'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import { GameModel } from '../models/game'

export const gameRouter = express.Router()

// Handles error
const gameRouterErrorHandler = createErrorHandler(new Map([
  [ 'adminsonly', 'Only admins can create new games.' ]
]))

// Specify model to use
gameRouter.use((req, res, next) => (
  res.locals.model = GameModel.instance,
  next()
))

gameRouter.get('/', isLoggedIn, gameRouterErrorHandler, async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;

  res.send(mustache.render(await loadTemplate("games"), {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    error
  }))
})

gameRouter.get('/view', isLoggedIn, gameRouterErrorHandler, async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;

  res.send(mustache.render(await loadTemplate("viewGames"), {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    error
  }))
})

gameRouter.get('/add', isLoggedIn, gameRouterErrorHandler, async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;

  if (user?.userType == 'basic')
    return res.redirect('/games?error=adminsonly')

  res.send(mustache.render(await loadTemplate("addGames"), {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    error
  }))
})

gameRouter.post('/add', isLoggedIn, gameRouterErrorHandler, async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  
  try {
    await model.createGame({ name: req.body.name, description: req.body.description })
  } catch (error) {
    res.redirect("/games/add?error=" + error)
  }
  res.redirect("/games")
})

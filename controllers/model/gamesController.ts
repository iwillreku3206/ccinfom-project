import express, { type NextFunction, type Request, type Response } from 'express'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import mustache from 'mustache'
import { GameModel } from '../../models/game'
import { render } from '../../util/io'

export const gameRouter = express.Router()

gameRouter.use(isLoggedIn)
gameRouter.use(modelHandler(GameModel.instance))
gameRouter.use(errorHandler(new Map([
  [ 'adminsonly', 'Only admins can create new games.' ]
])))

gameRouter.get('/', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req?.body?.name;

  // Grab the games then render
  const games = (!name || name.trim() == '')
   ? await model.getAllGames()
   : [ await model.getGame({ name }) ]
  const gameData = JSON.stringify(games)

  render(res, "games", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    gameData,
    error
  })
})

gameRouter.post('/', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req?.body?.name;

  // Grab the games then render
  const games = (!name || name.trim() == '')
   ? await model.getAllGames()
   : [ await model.getGame({ name }) ]
  const gameData = JSON.stringify(games)

  render(res, "games", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    gameData,
    error
  })
})

gameRouter.get('/add', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;

  if (user?.userType == 'basic')
    return res.redirect('/games?error=adminsonly')

  render(res, "manageGames", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    error
  })
})

gameRouter.post('/add', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  
  try {
    await model.createGame({ name: req.body.name, description: req.body.description })
  } catch (error) {
    res.redirect("/games/add?error=" + error)
  }
  res.redirect("/games")
})

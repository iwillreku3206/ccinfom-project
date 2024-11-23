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
  const name = req?.query?.name?.toString().trim() ?? '';

  // Grab the games then render
  const games = name == ''
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
  res.redirect("/games?name=" + name)
})

gameRouter.get('/manage', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req?.body?.name;

  if (user?.userType == 'basic')
    return res.redirect('/games?error=adminsonly')

  // Grab the games then render
  const games = (!name || name.trim() == '')
   ? await model.getAllGames()
   : [ await model.getGame({ name }) ]
  const gameData = JSON.stringify(games)

  render(res, "manageGames", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    gameData,
    error
  })
})

gameRouter.post('/manage', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req?.body?.name;
  
  try {
    await model.createGame({ name: req.body.name, description: req.body.description })
  } catch (error) {
    res.redirect("/games/manage?error=" + error)
  }
  res.redirect("/games/manage")
})

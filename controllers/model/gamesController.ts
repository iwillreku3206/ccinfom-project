import express, { type NextFunction, type Request, type Response } from 'express'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import mustache from 'mustache'
import { GameModel } from '../../models/game'
import { render } from '../../util/io'
import ItemModel from '../../models/item'

export const gameRouter = express.Router()

gameRouter.use(isLoggedIn)
gameRouter.use(modelHandler(GameModel.instance))
gameRouter.use(errorHandler(new Map([
  [ 'adminsonly', 'Only admins can create new games.' ],
  [ 'gamenotfound', 'The specified game does not exist.' ]
])))

gameRouter.get('/', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req.query?.name;

  // Grab the games then render
  const games = (!name || name == '')
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

gameRouter.get('/game', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const { game } = req?.query ?? {};

  // Grab the games then render
  const gameData = await model.getGame({ name: game })
  if(!gameData) return res.redirect('/game?error=gamenotfound')
  
  // Grab listings
  const items = await ItemModel.instance.getItemsByGame({ game: gameData.id });
  
  // Grab game and render
  render(res, "game", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    game: gameData.name,
    description: gameData.description,
    itemData: JSON.stringify(items),
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

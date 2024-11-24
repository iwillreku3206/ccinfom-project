import express, { type NextFunction, type Request, type Response } from 'express'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import mustache from 'mustache'
import { GameModel } from '../../models/game'
import { render } from '../../util/io'
import ItemModel from '../../models/item'
import { type ResultSetHeader } from 'mysql2';

export const gameRouter = express.Router()

gameRouter.use(isLoggedIn)
gameRouter.use(modelHandler(GameModel.instance))
gameRouter.use(errorHandler(new Map([
  [ 'adminsonly', 'Only admins can create new games.' ],
  [ 'gamenotfound', 'The specified game does not exist.' ],
  [ 'couldnotdelete', 'Could not delete game.' ],
  [ 'successfuldeletion', 'Game was successfully deleted.' ]
])))

gameRouter.get('/', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req.query?.name;

  // Grab the games then render
  const games = (!name || name == '')
   ? await model.getAllGames()
   : [ await model.getGameByName({ name }) ]
  const gameData = JSON.stringify(games)

  render(res, "games", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    gameData,
    error
  })
})

gameRouter.get('/instance', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const { game } = req?.query ?? {};

  // Grab the games then render
  const gameData = await model.getGame({ id: game })
  if(!gameData) return res.redirect('/instance?error=gamenotfound')
  
  // Grab listings
  const items = await ItemModel.instance.getItemsByGame({ game: gameData.id });
  
  // Grab game and render
  render(res, "game", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    admin: user.userType === "admin",
    id: gameData.id,
    game: gameData.name,
    description: gameData.description,
    itemData: JSON.stringify(items),
    error
  })
})

gameRouter.post('/', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const id = req?.body?.id;
  res.redirect("/game?id=" + id)
})

gameRouter.post('/delete', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const id = req?.body?.id;
  const game = await GameModel.instance.getGame({ id })
  const result = await GameModel.instance.deleteGame({ id }) as ResultSetHeader
  
  if(!result || result.affectedRows < 1) {
    res.send({ error: 'couldnotdelete', id: game?.id })
    return
  }

  if(result.affectedRows === 1) {
    res.send({ redirect: '/game', error: 'successfuldeletion'  })
    return
  }

})

gameRouter.get('/manage', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req?.body?.name;

  if (user?.userType == 'basic')
    return res.redirect('/game?error=adminsonly')

  // Grab the games then render
  const games = (!name || name.trim() == '')
   ? await model.getAllGames()
   : [ await model.getGameByName({ name }) ]
  const gameData = JSON.stringify(games)

  render(res, "manageGames", {
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    admin: user.userType === "admin",
    gameData,
    error
  })
})

gameRouter.post('/create', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;
  const name = req?.body?.name;
  
  try {
    await model.createGame({ name: req.body.name, description: req.body.description })
  } catch (error) {
    res.redirect("manage?error=" + error)
  }
  res.redirect("manage")
})

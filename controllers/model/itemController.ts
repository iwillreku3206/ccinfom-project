import express, { type Request, type Response } from 'express'
import { isLoggedIn, modelHandler } from '../../util/plugins'
import { render } from '../../util/io'
import ItemModel from '../../models/item'
import { GameModel } from '../../models/game'

export const itemRouter = express.Router()

itemRouter.use(isLoggedIn)

itemRouter.get('/', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
	const { name = '', game = '' } = req.query;

  // Grab the games then render
  const items = (!name || name == '')
   ? (!game || game == '')
	 ? await ItemModel.instance.getAllItems()
	 : await ItemModel.instance.getItemsByGame({ game: parseInt(game.toString()) })
   : [ await ItemModel.instance.getItemByName({ name: name.toString() }) ]
  const itemData = JSON.stringify(items)

  render(res, "items", {
    username: user?.username,
    displayName: user?.displayName,
		itemData,  
    error
  })
})

itemRouter.get('/manage', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
	const { name = '', game = '' } = req.query;

  // Grab the games then render
  const items = (!name || name == '')
   ? (!game || game == '')
	 ? await ItemModel.instance.getAllItems()
	 : await ItemModel.instance.getItemsByGame({ game: parseInt(game.toString()) })
   : [ await ItemModel.instance.getItemByName({ name: name.toString() }) ]
  const itemData = JSON.stringify(items)
	const gameData = JSON.stringify(await GameModel.instance.getAllGames())

  render(res, "manageItems", {
    username: user?.username,
    displayName: user?.displayName,
		itemData,  
		gameData,
    error
  })
})

itemRouter.post('/create', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
	const { name = '', game, description = '' } = req.body
  
  try {
    await ItemModel.instance.createItem({ name, game, description })
  } catch (error) {
    res.redirect("manage?error=" + error)
  }
  res.redirect("manage")
})
import express, { type Request, type Response } from 'express'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import { render } from '../../util/io'
import ItemModel from '../../models/item'
import { GameModel } from '../../models/game'
import ListingModel from '../../models/listing'
import type { ResultSetHeader } from 'mysql2'

export const itemRouter = express.Router()

itemRouter.use(isLoggedIn)
itemRouter.use(errorHandler(new Map([
  [ 'insufficientfunds', ' Your balance is insufficient to make that purchase.' ],
  [ 'successfulpurchase', 'Item was purchased successfully.' ],
  [ 'successfuldeletion', 'Item was deleted successfully.' ],
  [ 'sellerequalsbuyer', 'You cannot buy your own listings.' ]
])))

itemRouter.get('/instance', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
	const { id } = req.query;

  if(!id) {
    res.redirect('/game/')
    return;
  }

  // Grab item data
  const item = await ItemModel.instance.getItem({ id: parseInt(id.toString()) })
  const listings = await ListingModel.instance.getFilteredListings('item', item?.id)

  // Render page
  render(res, "item", {
    username: user?.username,
    displayName: user?.displayName,
    admin: user.userType === 'admin',
    id: item?.id,
    item: item?.name,
    description: item?.description,
    listingData: JSON.stringify(listings),
    error
  })
})

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

itemRouter.post('/delete', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
  const id = req?.body?.id;

  const item = await ItemModel.instance.getItem({ id })
  const result = await ItemModel.instance.deleteItem({ id }) as ResultSetHeader
  
  if(!result || result.affectedRows < 1) {
    res.send({ error: 'couldnotdelete', id: item?.id })
    return
  }

  if(result.affectedRows === 1) {
    res.send({ redirect: '/item/manage', error: 'successfuldeletion'  })
    return
  }
})
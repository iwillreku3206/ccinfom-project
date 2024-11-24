import argon2 from 'argon2'
import express, { type NextFunction, type Request, type Response } from 'express'
import log from 'log'
import mustache from 'mustache'
import UserInventoryItemModel from '../../models/inventory'
import { render } from '../../util/io'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import UserModel from '../../models/user'
import ItemModel from '../../models/item'


const redirectError = (res: Response, error_code: string) => res.redirect("/inventory/inspect?error=" + error_code);
const ERRCODES = Object.freeze({
    INVALID_SESSION : "invalid_session"
  , MISSING_FIELDS  : "missing_fields"
  , MISSING_USER    : "missing_user"
  , NO_ITEMS        : "no_items"
})

export const inventoryRouter = express.Router()

inventoryRouter.use(isLoggedIn)
inventoryRouter.use(modelHandler(UserInventoryItemModel.instance))

inventoryRouter.use(errorHandler(new Map([
  ['missingfields',     'A price must be specified to sell the item.'],
  ['missinguser',       'User does not exist.'],
  ['invaliditem',       'Item does not exist.'],
  ['invalidinventory',  'Inventory item does not exist.'],
  ['itemlisted',          'Item was successfully marked for selling.'],
])))

inventoryRouter.get('/userself', async (req, res) => {
  const { user, model, error } = res.locals;
  res.redirect("/inventory/user/" + user.username)
})

inventoryRouter.get('/instance/:id', async (req, res) => {
  const { user, model, error } = res.locals;
  const id = req.params.id;

  // Get inventory item
  const inventoryItem = await UserInventoryItemModel.instance.getInventoryItem({ id: parseInt(id.toString()) })
  if(!inventoryItem) {
    res.redirect('/inventory/userself?error=invalidinventory')
    return
  }

  // Get actual item
  const item = await ItemModel.instance.getItem({ id: inventoryItem?.item })
  if(!item) {
    res.redirect('/inventory/userself?error=invaliditem')
    return
  }

  await render(res, "profileItem", {
    username: user?.username,
    displayName: user?.displayName,
    inventoryItem: item.name,
    description: item.description,
    itemId: item.id,
    id: id,
    error
});
})

inventoryRouter.post('/inspect', async (req, res) => {
  const { user, model, error } = res.locals;

  const selectedItems = await model.getFilteredInventoryItems("user", user.id)

  console.log(selectedItems)

  // ! remove
  res.end()

  // if (!selectedItems)
  //   return redirectError(res, ERRCODES["NO_ITEMS"])

  // const viewOpts = { 
  //   username: user?.username,
  //   displayName: user?.displayName,
  //   items: selectedItems,
  //   error
  // }
  
  // await render(res, "inventory", viewOpts);
})

inventoryRouter.post('/sell', async (req, res) => {
  const { user, model, error } = res.locals;
  const { id, price } = req.body 

  // Missing params
  if(id == undefined || price == undefined) {
    res.redirect(`/inventory/userself?error='missingfields`)
    return
  }

  // Sell item
  await UserInventoryItemModel.instance.sellInventoryItem({ id, price })
  res.redirect('/inventory/userself?error=itemlisted')
})

inventoryRouter.get('/user/:username', async (req, res) => {
  const { user, model, error } = res.locals;
  const userModel = UserModel.instance

  const selectedUser = await userModel.getUserByUsername(req.params.username)

  if (selectedUser == null){
    log.warn("User does not exist.")
    return res.redirect(`/inventory/userself?error=missinguser`)
  }
  
  const selectedItems = JSON.stringify(await model.getFilteredInventoryItems("user", selectedUser.id))

  const viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    items: selectedItems,
    error
  }

  await render(res, "profileItems", viewOpts);
})

inventoryRouter.get('/createItems', async (req, res) =>{
  const { user, model, error } = res.locals;

  let viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    error
  }
  
  await render(res, "createItems", viewOpts)
})

inventoryRouter.post('/createItems', async (req, res) =>{
  const { user, model, error } = res.locals;

  await model.createInventoryItem()
})


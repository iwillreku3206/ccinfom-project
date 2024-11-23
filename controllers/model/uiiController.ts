import argon2 from 'argon2'
import express, { type NextFunction, type Request, type Response } from 'express'
import mustache from 'mustache'
import { isLoggedIn, errorHandler, modelHandler } from '../../util/plugins'
import { render } from '../../util/io'
import UserInventoryItemModel from '../../models/userInventoryItems'
import log from 'log'


const redirectError = (res: Response, error_code: string) => res.redirect("/userinventoryitems/inspect?error=" + error_code);
const ERRCODES = Object.freeze({
    INVALID_SESSION : "invalid_session"
  , MISSING_FIELDS  : "missing_fields"
  , MISSING_USER    : "missing_user"
  , NO_ITEMS        : "no_items"
})

export const userInvItemsRouter = express.Router()

userInvItemsRouter.use(isLoggedIn)
userInvItemsRouter.use(modelHandler(UserInventoryItemModel.instance))
userInvItemsRouter.use(errorHandler(new Map([
  ['invalidSession',  ''],
  ['missingFields',   ''],
  ['missingUser',     ''],
  ['noItems',         'No Items currently in your inventory.'],
])))

userInvItemsRouter.get('/user', async (req, res) => {
  const { user, model, error } = res.locals;
  res.redirect("/userinventoryitems/" + user.username)
})

userInvItemsRouter.get('/:username', async (req, res) => {
  const { user, model, error } = res.locals;

  const selectedItems = JSON.stringify(await model.getFilteredInventoryItems("user", user.username))


  const viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    items: selectedItems,
    error
  }

  render(res, "profileItems", viewOpts);
})

userInvItemsRouter.get('/inspect', isLoggedIn, async (req, res) => {
  const { user, model, error } = res.locals;
  
  log.info("inspect")
  let viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    items: "No items",
    error
  }
  
  await render(res, "userInventoryItems", viewOpts)
})

userInvItemsRouter.post('/inspect', async (req, res) => {
  const { user, model, error } = res.locals;

  const selectedItems = await model.getFilteredInventoryItems("user", user.username)

  console.log(selectedItems)
  if (!selectedItems)
    return redirectError(res, ERRCODES["NO_ITEMS"])

  const viewOpts = { items: selectedItems }
  await render(res, "userInventoryItems", viewOpts);
})





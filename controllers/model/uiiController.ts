import argon2 from 'argon2'
import express, { type NextFunction, type Request, type Response } from 'express'
import log from 'log'
import mustache from 'mustache'
import UserInventoryItemModel from '../../models/userInventoryItems'
import { render } from '../../util/io'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import UserModel from '../../models/user'


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
  ['missingUser',     'User does not Exist'],
  ['noItems',         'No Items currently in your inventory.'],
])))

userInvItemsRouter.get('/user', async (req, res) => {
  const { user, model, error } = res.locals;

  const viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    error
  }

  await render(res, "profileItems", viewOpts);
})

userInvItemsRouter.get('/userself', async (req, res) => {
  const { user, model, error } = res.locals;
  res.redirect("/userinventoryitems/user/" + user.username)
})

userInvItemsRouter.get('/inspect', async (req, res) => {
  const { user, model, error } = res.locals;

  let viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    error
  }
  
  await render(res, "userInventoryItems", viewOpts)
})

userInvItemsRouter.post('/inspect', async (req, res) => {
  const { user, model, error } = res.locals;

  const selectedItems = await model.getFilteredInventoryItems("user", user.id)

  console.log(selectedItems)

  if (!selectedItems)
    return redirectError(res, ERRCODES["NO_ITEMS"])

  const viewOpts = { 
    username: user?.username,
    displayName: user?.displayName,
    items: selectedItems,
    error
  }
  
  await render(res, "userInventoryItems", viewOpts);
})

userInvItemsRouter.get('/user/:username', async (req, res) => {
  const { user, model, error } = res.locals;
  const userModel = UserModel.instance

  const selectedUser = await userModel.getUserByUsername(req.params.username)

  if (selectedUser == null){
    log.warn("User does not exist.")
    return res.redirect(`/user?error=missingUser`)
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

userInvItemsRouter.get('/createItems', async (req, res) =>{
  const { user, model, error } = res.locals;

  let viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    error
  }
  
  await render(res, "createItems", viewOpts)
})

userInvItemsRouter.post('/createItems', async (req, res) =>{
  const { user, model, error } = res.locals;

  await model.createInventoryItem()
})


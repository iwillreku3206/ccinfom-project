import express, { type NextFunction, type Request, type Response } from 'express'
import { getInventoryItemByUserId } from '../models/userInventoryItems'
import { isLoggedIn } from './plugins'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import argon2 from 'argon2'
import SessionModel from '../models/session'
import UserModel from '../models/user'


const pageRender = async (res: Response, templateName: string, viewOpts: {}) => res.send(mustache.render(await loadTemplate(templateName), viewOpts))
const redirectError = (res: Response, error_code: string) => res.redirect("/userinventoryitems/inspect?error=" + error_code);

const ERRCODES = Object.freeze({
  INVALID_SESSION: "invalid_session"
  , MISSING_FIELDS: "missing_fields"
  , MISSING_USER: "missing_user"
  , NO_ITEMS: "no_items"

})

export const userInvItemsRouter = express.Router()

userInvItemsRouter.get('/usersitems', isLoggedIn, async (req, res) => {
  const session = req.cookies?.session || '';
  const user = res.locals.user

  try {
    if (user == null)
      return redirectError(res, ERRCODES["INVALID_SESSION"])

    return res.redirect("/userinventoryitems/" + user.username)
  } catch {
    return redirectError(res, ERRCODES["INVALID_SESSION"])
  }

})

userInvItemsRouter.get('/:username', isLoggedIn, async (req, res) => {

  const username = req.params.username
  console.log(username)

  if (!username)
    return redirectError(res, ERRCODES["MISSING_FIELDS"])

  try {
    const user = res.locals.user
    if (!user)
      return redirectError(res, ERRCODES["MISSING_USER"])

    const selectedItems = await (getInventoryItemByUserId(user?.id))
    console.log(selectedItems)
    if (!selectedItems)
      return redirectError(res, ERRCODES["NO_ITEMS"])

    const viewOpts = {
      username: user?.username,
      displayName: user?.displayName,
      items: selectedItems
    }

    await pageRender(res, "profileItems", viewOpts);
  } catch (error) {
    return redirectError(res, String(error))
  }
})


userInvItemsRouter.get('/inspect', isLoggedIn, async (req, res) => {
  const user = res.locals.session
  let error = ""

  if (req.query.error)
    error = req.query.error.toString()

  let viewOpts = {
    username: user?.username,
    displayName: user?.displayName,
    items: "No items",
    error
  }

  await pageRender(res, "userInventoryItems", viewOpts)
})


userInvItemsRouter.post('/inspect', isLoggedIn, async (req, res) => {
  const { username } = req.body

  if (!username)
    return res.redirect("/userinventoryitems/inspect/?error=missingfields")


  try {
    const selectedUser = await UserModel.instance.getUserByUsername(username)

    if (!selectedUser)
      return redirectError(res, ERRCODES["MISSING_USER"])

    const selectedItems = await (getInventoryItemByUserId(selectedUser?.id))
    console.log(selectedItems)

    if (!selectedItems)
      return redirectError(res, ERRCODES["NO_ITEMS"])

    const viewOpts = { items: selectedItems }

    await pageRender(res, "userInventoryItems", viewOpts);
  } catch (error) {
    return redirectError(res, String(error))
  }
})

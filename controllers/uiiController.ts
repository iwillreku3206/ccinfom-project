import express, { type NextFunction, type Request, type Response } from 'express'
import { getInventoryItemByUserId } from '../models/userInventoryItems'
import { isLoggedIn } from './authController'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import argon2 from 'argon2'
import { createSession, expireSession, type Session } from '../models/session'
import { getUserBySession, getUserByUsername } from '../models/user'




const pageRender = async (templateName: string, viewOpts: {}) => mustache.render(await loadTemplate(templateName), viewOpts)

export const userInvItemsRouter = express.Router()

userInvItemsRouter.get('/usersitems', isLoggedIn, async(req, res) =>{
  const session = req.cookies?.session || '';

  try {
    const user = await getUserBySession(session)

    if (user == null)
      return res.redirect("/userinventoryitems/inspect/?error=invalid_session")

    return res.redirect("/userinventoryitems/"+user.username)
  } catch {
    return res.redirect("/userinventoryitems/inspect/?error=invalid_session")
  }
  
})

userInvItemsRouter.get('/:username', isLoggedIn, async(req, res) =>{
  
  const username = req.params.username
  console.log(username)

  if (!username)
    return res.redirect("/userinventoryitems/inspect/?error=missingfields")

  
  try {
    const user = await (getUserByUsername(username))

    if (!user)
      return res.redirect("/userinventoryitems/inspect?error=noaccount")
    
    const selectedItems = await (getInventoryItemByUserId(user?.id))
    console.log(selectedItems)

    if (!selectedItems)
      return res.redirect("/userinventoryitems/inspect?error=no_items")
    
    const viewOpts = {
      username: user?.username,
      displayName: user?.displayName, 
      items: selectedItems
    }

    res.send(await pageRender("profileItems", viewOpts));


  } catch (error) {
    return res.redirect("/userinventoryitems/inspect?error=" + error)
  }
})


userInvItemsRouter.get('/inspect', isLoggedIn, async (req, res) => {
  const user = await getUserBySession(req.cookies?.session || '')
  let error = ""

  if (req.query.error)
    error = req.query.error.toString()
  
  let viewOpts = {
    username: user?.username,
    displayName: user?.displayName, 
    items: "No items",
    error
  }
  res.send(await pageRender("userInventoryItems", viewOpts))
})


userInvItemsRouter.post('/inspect', isLoggedIn, async (req, res) => {
  const {username} = req.body

  if (!username)
    return res.redirect("/userinventoryitems/inspect/?error=missingfields")

  
  try {
    const selectedUser = await (getUserByUsername(username))

    if (!selectedUser)
      return res.redirect("/userinventoryitems/inspect?error=noaccount")
    
    const selectedItems = await (getInventoryItemByUserId(selectedUser?.id))
    console.log(selectedItems)

    if (!selectedItems)
      return res.redirect("/userinventoryitems/inspect?error=no_items")
    
    const viewOpts = {items: selectedItems}

    res.send(await pageRender("userInventoryItems", viewOpts));


  } catch (error) {
    return res.redirect("/userinventoryitems/inspect?error=" + error)
  }
})

/**
 * userInventoryItemsRouter.post(`/addItems`, async (req, res) => {
  let body = req.body

  try {
    const user = await getUserByUsername(body.username)
  } catch (error) {
    return res.redirect("/userinventoryitems/addItems?error=" + error)
  }

})
 * 
 */
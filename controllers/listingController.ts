/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 11:34:48
 * @ Modified time: 2024-11-16 13:52:24
 * @ Description:
 * 
 * A controller for the listings-related pages and functionality.
 */

import express, { type NextFunction, type Request, type Response } from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import { isLoggedIn } from './authController'
import { Listing } from '../models/listing'

// The router to use
export const listingRouter = express.Router()

/**
 * The page for the create listing form.
 */
listingRouter.get('/create', isLoggedIn, async(req: Request, res: Response) => {
  const { user, error } = res.locals;
  res.send(mustache.render(await loadTemplate("createListing"), { error }))
})

/**
 * Grabs the listings associated with the user.
 */
listingRouter.get('/list', isLoggedIn, async (req: Request, res: Response) => {
  const { user, error } = res.locals;
  const listingData = JSON.stringify(await Listing.getListings())
  res.send(mustache.render(await loadTemplate("viewListings"), { listingData, error }))
})

/**
 * A request for posting a new listing in the database.
 */
listingRouter.post('/post', isLoggedIn, async(req: Request, res: Response) => {
  const { user, error } = res.locals;

  // ! todo, search for item in item database
  // ! then create listing
  // ! remove random price lmao

  Listing.createListing({ item: 1, price: Math.random() * 1000, seller: user.id })
    .then((result) => res.redirect('/home'))
    .catch((error) => res.status(500).redirect('/listing/create?error=' + error))
})
/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 11:34:48
 * @ Modified time: 2024-11-19 14:57:13
 * @ Description:
 * 
 * A controller for the listings-related pages and functionality.
 */

import express, { type NextFunction, type Request, type Response } from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import { isLoggedIn } from './authController'
import { Listing } from '../models/listing';

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
  const listingData = JSON.stringify(await Listing.execute('get-all'))

  res.send(mustache.render(await loadTemplate("viewListings"), { listingData, error }))
})

/**
 * Grabs the listings associated with the user.
 */
listingRouter.post('/list', isLoggedIn, async (req: Request, res: Response) => {
  const { user, error } = res.locals;
  const { item, seller, price, date } = req.body;

  // ! remove the parsing here
  // ! improve logic
  const listings = await (() => (
      item?.length    ? Listing.execute('get-by-item', { item: parseInt(item) })
    : seller?.length  ? Listing.execute('get-by-seller', { seller: parseInt(seller) }) 
    // : price?.length   ? Listing.getListings('price', parseFloat(price)) 
    // : date?.length    ? Listing.getListings('list_date', date)
    : Listing.execute('get-all')
    ))()
  const listingData = JSON.stringify(listings)

  console.log(listingData)

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

  Listing.execute('create', { item: 1, price: Math.random() * 1000, seller: user.id })
    .then((result) => res.redirect('/home'))
    .catch((error) => res.status(500).redirect('/listing/create?error=' + error))
})
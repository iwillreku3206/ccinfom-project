/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 11:34:48
 * @ Modified time: 2024-11-23 03:24:00
 * @ Description:
 * 
 * A controller for the listings-related pages and functionality.
 */

import express, { type NextFunction, type Request, type Response } from 'express'
import mustache from 'mustache'
import { loadTemplate } from '../../util/loadTemplate'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import ListingModel from '../../models/listing';

// The router to use
export const listingRouter = express.Router()

// Specify the model to use
listingRouter.use(isLoggedIn)
listingRouter.use(modelHandler(ListingModel.instance))
listingRouter.use(errorHandler(new Map([])))

/**
 * The page for the create listing form.
 */
listingRouter.get('/create', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
  res.send(mustache.render(await loadTemplate("createListing"), { error }))
})

/**
 * Grabs the listings associated with the user.
 */
listingRouter.get('/list', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
  const listingData = JSON.stringify(await ListingModel.instance.getAllListings())

  res.send(mustache.render(await loadTemplate("viewListings"), { listingData, error }))
})

/**
 * Grabs the listings associated with the user.
 */
listingRouter.post('/list', async (req: Request, res: Response) => {
  const { user, error } = res.locals;
  const { item, seller, price, date } = req.body;

  // const listings = await (() => (
  //   item?.length ? Listing.execute('get-by-item', { item: parseInt(item) })
  //     : seller?.length ? Listing.execute('get-by-seller', { seller: parseInt(seller) })
  //       // : price?.length   ? Listing.getListings('price', parseFloat(price)) 
  //       // : date?.length    ? Listing.getListings('list_date', date)
  //       : Listing.execute('get-all')
  // ))()
  const listingData = JSON.stringify([])

  res.send(mustache.render(await loadTemplate("viewListings"), { listingData, error }))
})

/**
 * A request for posting a new listing in the database.
 */
listingRouter.post('/post', async (req: Request, res: Response) => {
  const { user, model, error } = res.locals;

  // ! todo, search for item in item database
  // ! then create listing
  // ! remove random price lmao

  model.createListing({ item: 1, price: Math.random() * 1000, seller: user.id })
    .then(() => res.redirect('/home'))
    .catch((error: Error) => res.status(500).redirect('/listing/create?error=' + error))
})

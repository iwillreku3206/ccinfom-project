/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 11:34:48
 * @ Modified time: 2024-11-23 04:14:52
 * @ Description:
 * 
 * A controller for the listings-related pages and functionality.
 */

import express from 'express'
import { render } from '../../util/io'
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
listingRouter.get('/create', async (req, res) => {
  const { user, model, error } = res.locals;
  render(res, "createListing", { error })
})

/**
 * Grabs the listings associated with the user.
 */
listingRouter.get('/view', async (req, res) => {
  const { user, model, error } = res.locals;
  const listingData = JSON.stringify(await model.getAllListings())
  render(res, 'viewListings', { listingData, error })
})

/**
 * Grabs the listings associated with the user.
 */
listingRouter.post('/view', async (req, res) => {
  const { user, model, error } = res.locals;
  const { item, seller, price, date } = req.body;

  // const listings = await (() => (
  //     item?.length ? Listing.execute('get-by-item', { item: parseInt(item) })
  //   : seller?.length ? Listing.execute('get-by-seller', { seller: parseInt(seller) })
  //   : price?.length   ? Listing.getListings('price', parseFloat(price)) 
  //   : date?.length    ? Listing.getListings('list_date', date)
  //   : await model.getAllListings()
  // ))()
  const listingData = JSON.stringify([])
  render(res, 'viewListings', { listingData, error })
})

/**
 * A request for posting a new listing in the database.
 */
listingRouter.post('/post', async (req, res) => {
  const { user, model, error } = res.locals;

  // ! todo, search for item in item database
  // ! then create listing
  // ! remove random price lmao

  model.createListing({ item: 1, price: Math.random() * 1000, seller: user.id })
    .then(() => res.redirect('/home'))
    .catch((error: Error) => res.status(500).redirect('/listing/create?error=' + error))
})

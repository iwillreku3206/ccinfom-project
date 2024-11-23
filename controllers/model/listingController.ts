/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 11:34:48
 * @ Modified time: 2024-11-23 11:44:55
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
  let { item, seller, pricemin, pricemax, datemin, datemax } = req.body;

  // Set the bounds if at least one defined
  if(pricemin?.length || pricemax?.length) {
    pricemin = pricemin?.length ? pricemin : '0'
    pricemax = pricemax?.length ? pricemax : (1e20).toString()
  }

  // Set the bounds if at least one defined
  if(datemin?.length || datemax?.length) {
    datemin = datemin?.length ? datemin : '0'
    datemax = datemax?.length ? datemax : (1e20).toString()
  }

  // Grab listings then render
  const listings = await (() => (
      item?.length        ? model.getFilteredListings('item', parseInt(item))
    : seller?.length      ? model.getFilteredListings('seller', parseInt(seller))
    : pricemin?.length    ? model.getFilteredListings('price', parseFloat(pricemin), parseFloat(pricemax)) 
    : datemin?.length     ? model.getFilteredListings('list_date', parseInt(datemin), parseInt(datemax))
    : model.getAllListings()
  ))()
  const listingData = JSON.stringify(listings)
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

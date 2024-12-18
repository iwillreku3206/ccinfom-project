/**
 * @ Author: Group ??
 * @ Create Time: 2024-11-16 11:34:48
 * @ Modified time: 2024-11-24 13:15:09
 * @ Description:
 * 
 * A controller for the listings-related pages and functionality.
 */

import express from 'express'
import { render } from '../../util/io'
import { errorHandler, isLoggedIn, modelHandler } from '../../util/plugins'
import ListingModel from '../../models/listing';
import UserModel from '../../models/user';
import ItemModel from '../../models/item';

// The router to use
export const listingRouter = express.Router()

// Specify the model to use
listingRouter.use(isLoggedIn)
listingRouter.use(modelHandler(ListingModel.instance))
listingRouter.use(errorHandler(new Map([
  [ 'insufficientfunds', ' Your balance is insufficient to make that purchase.' ],
  [ 'successfulpurchase', 'Item was purchased successfully.' ],
  [ 'sellerequalsbuyer', 'You cannot buy your own listings.' ]
])))

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
  render(res, 'viewListings', { 
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    listingData, error 
  })
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
  render(res, 'viewListings', { 
    username: user?.username, 
    displayName: user?.displayName || user?.username,
    listingData, error 
  })
})

listingRouter.post(`/buy`, async (req, res) => {
  const { user, model, error } = res.locals;
  const { listing_id } = req.body;
  
  // Grab the listing
  const listing = await ListingModel.instance.getListing({ id: listing_id })
  if(!listing) return
  if(user.id == listing.seller) {
    res.send({ error: 'sellerequalsbuyer' })
    return
  }
  if(parseFloat(user.balance) < listing.price) {
    res.send({ error: 'insufficientfunds' })
    return
}
  
  // Buy listing
  await ListingModel.instance.buyListing({ id: listing_id, buyer_id: user.id })

  // Succssful transaction
  res.send({ error: 'successfulpurchase' })
})

listingRouter.post(`/buy/getListings`, async (req, res) => {
  const { user, model, error } = res.locals;

  let { item, seller, pricemin, pricemax, datemin, datemax } = req.body;

  // Set the bounds if at least one defined
  if (pricemin?.length || pricemax?.length) {
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
  render(res, "buyListings", { listingData, error })
})
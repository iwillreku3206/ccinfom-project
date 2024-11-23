import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'
import ItemModel from '../../models/item'
import ListingModel from '../../models/listing'
import { which } from 'bun'

export const reportsRouter = express.Router()

reportsRouter.use(isLoggedIn)
reportsRouter.use(isAdmin)

reportsRouter.get('/', async (req, res) => {
  const { user } = res.locals;
  render(res, "reports", {
    username: user?.username,
    displayName: user?.displayName || user?.username
  })
})

reportsRouter.get('/marketPrice', async (req, res) => {
  const { user } = res.locals;
  const items = await ItemModel.instance.getAllItemsWithGameName()
  render(res, "reports/marketpriceReportOptions", {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    items,
    error: req.query.error || ''
  })
})

reportsRouter.get('/marketPriceReport', async (req, res) => {
  const { user } = res.locals;

  if (req.query.year == "")
    res.redirect("/marketPrice?error=Invalid year")

  const itemDetails = await ItemModel.instance.getItemWithGameNameById(parseInt(String(req.query.item)))

  if (!itemDetails) return res.redirect("/marketPrice?error=Invalid item")

  const listings = await ListingModel.instance.marketPriceReport(parseInt(String(req.query.year)), parseInt(String(req.query.item)))
  const total = listings.reduce((prev, curr) => prev + parseFloat(String(curr.price)), 0)
  const average = total / listings.length
  console.log({ total, average, len: listings.length })


  render(res, "reports/marketpriceReport", {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    listings,
    total,
    average,
    len: listings.length,
    itemName: itemDetails.name,
    gameName: itemDetails.game
  })
})

reportsRouter.get('/itemsListed', async (req, res) => {
  const { user } = res.locals;
  const items = await ItemModel.instance.getAllItemsWithGameName()
  render(res, "reports/itemsListedReportOptions", {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    items,
    error: req.query.error || ''
  })
})

reportsRouter.get('/itemsListedReport', async (req, res) => {
  const { user } = res.locals;

  if (req.query.year == "")
    res.redirect("/itemsListed?error=Invalid year")

  const itemDetails = await ItemModel.instance.getItemWithGameNameById(parseInt(String(req.query.item)))

  if (!itemDetails) return res.redirect("/itemsListed?error=Invalid item")

  const listings = await ItemModel.instance.itemsListedReport(parseInt(String(req.query.item)), parseInt(String(req.query.year)))

  render(res, "reports/itemsListedReport", {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    listings,
    len: listings.length,
    itemName: itemDetails.name,
    gameName: itemDetails.game
  })
})
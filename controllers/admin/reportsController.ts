import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'
import ItemModel from '../../models/item'
import ListingModel from '../../models/listing'
import { which } from 'bun'
import UserModel from '../../models/user'
import SessionModel from '../../models/session'
import { getMonthFromNumber } from '../../util/getMonthFromNumber'

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

reportsRouter.get('/activeCount', async (req, res) => {
  const { user } = res.locals;
  const items = await ItemModel.instance.getAllItemsWithGameName()
  render(res, "reports/activeUsersReportOptions", {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    items,
    error: req.query.error || ''
  })
})


const sum = (x: number[]) => x.reduce((prev, curr) => prev + curr, 0)

reportsRouter.get('/activeCountReport', async (req, res) => {
  const { user } = res.locals;

  if (req.query.year == "")
    res.redirect("/marketPrice?error=Invalid year")

  const year = parseInt(String(req.query.year || "0000"))

  const userCount = await UserModel.instance.userCount()
  const activeUserCount = await SessionModel.instance.activeUsers(year)
  const loginCount = await SessionModel.instance.loginCount(year)

  const averageActiveUsers = sum(activeUserCount.map(x => x.count)) / 12
  const averageLoginCount = sum(loginCount.map(x => x.count)) / 12

  render(res, "reports/marketpriceReport", {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    userCount,
    activeUserCount: activeUserCount.map(a => ({ count: a.count, month: getMonthFromNumber(a.month) })),
    loginCount: loginCount.map(a => ({ count: a.count, month: getMonthFromNumber(a.month) })),
    averageActiveUsers,
    averageLoginCount,
    activeUserRate: averageActiveUsers / userCount * 100,
    year
  })
})


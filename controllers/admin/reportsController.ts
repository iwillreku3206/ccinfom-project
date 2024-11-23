import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'
import ItemModel from '../../models/item'
import ListingModel from '../../models/listing'
import { which } from 'bun'
import UserModel from '../../models/user'
import SessionModel from '../../models/session'
import { getMonthFromNumber } from '../../util/getMonthFromNumber'
import { db } from '../../app/database'

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

reportsRouter.get('/useritems', async (req, res) => {
  const { user } = res.locals;
  const items = await ItemModel.instance.getAllItemsWithGameName()
  render(res, "reports/uiiReportOptions", {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    items,
    error: req.query.error || ''
  })
})

const totalUserItems = `
  SELECT  COUNT(*) AS count
  FROM    inventory_items;
`

const added = `
  SELECT  g.name AS gameName,
          i.name AS itemName,
          COUNT(ii.id) AS count
  FROM    past_inventory_items ii
  JOIN    items i 
      ON  i.id = ii.item
  JOIN    games g 
      ON  g.id = i.game
  WHERE   YEAR(ii.lost_on) = ?
  GROUP BY i.name
  ORDER BY count DESC;
`
const removed = `
  SELECT  g.name AS gameName,
          i.name AS itemName,
          COUNT(ii.id) AS count
  FROM    inventory_items ii
  JOIN    items i 
      ON  i.id = ii.item
  JOIN    games g 
      ON  g.id = i.game
  WHERE   YEAR(ii.obtained_on) = ?
  GROUP BY i.name
  ORDER BY count DESC;
`

reportsRouter.get('/userItemsReport', async (req, res) => {
  const { user } = res.locals;

  if (req.query.year == "")
    res.redirect("/marketPrice?error=Invalid year")

  const year = parseInt(String(req.query.year || "0000"))

  //@ts-ignore
  const count: number = (await db.execute(totalUserItems))[0][0].count
  //@ts-ignore
  const addedItems: any[] = (await db.execute(added, [year]))[0]
  //@ts-ignore
  const removedItems: any[] = (await db.execute(removed, [year]))[0]

  const must = {
    username: user?.username,
    displayName: user?.displayName || user?.username,
    count,
    addedItems,
    removedItems,
    addedSum: sum(addedItems.map(a => a.count)),
    removedSum: sum(removedItems.map(a => a.count)),
    year
  }
  console.log(must)

  render(res, "reports/uiiReport", must)
})

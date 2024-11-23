import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'
import ItemModel from '../../models/item'

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
    items
  })
})

import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'

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

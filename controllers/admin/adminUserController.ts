import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'

export const adminUserRouter = express.Router()

adminUserRouter .get('/', async (req, res) => {
  const { user } = res.locals;
  render(res, "admin", { 
    username: user?.username, 
    displayName: user?.displayName || user?.username 
  })
})

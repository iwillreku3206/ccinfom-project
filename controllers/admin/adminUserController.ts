import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'
import UserModel from '../../models/user'

export const adminUserRouter = express.Router()

adminUserRouter.get('/', async (req, res) => {
  const { user } = res.locals;
  const suname = String(req.query.username || '')
  const stype = String(req.query.userType || '') as 'basic' | 'admin'
  const users = await UserModel.instance.getAllUsersByTypeAndUsernameQuery(
    suname,
    stype
  )
  console.log(users)
  render(res, "adminViewUsers", {
    cusername: user?.username,
    cdisplayName: user?.displayName || user?.username,
    users,
    suname,
    selany: stype as any === '',
    selbas: stype === 'basic',
    seladmin: stype === 'admin'
  })
})

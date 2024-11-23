import express from 'express'
import { isAdmin, isLoggedIn } from '../../util/plugins'
import { render } from '../../util/io'
import UserModel from '../../models/user'
import SessionModel from '../../models/session'
import ListingModel from '../../models/listing'

export const adminUserRouter = express.Router()

adminUserRouter.get('/', async (req, res) => {
  const { user } = res.locals;
  const suname = String(req.query.username || '')
  const stype = String(req.query.userType || '') as 'basic' | 'admin'
  const users = await UserModel.instance.getAllUsersByTypeAndUsernameQuery(
    suname,
    stype
  )
  render(res, "adminViewUsers", {
    cusername: user?.username,
    cdisplayName: user?.displayName || user?.username,
    users,
    suname,
    selany: stype as any === '',
    selbas: stype === 'basic',
    seladmin: stype === 'admin',
    error: res.locals.error || req.query.error || ''
  })
})

adminUserRouter.post('/delete', async (req, res) => {
  try {
    const id = req.body.id
    await SessionModel.instance.deleteUserSessions(id)
    await ListingModel.instance.deleteAllListingsOfUser(id)

    await UserModel.instance.deleteUser(id)
    res.redirect("/admin/users")
  } catch (e) {
    res.redirect("/admin/users?error=" + e)
  }
})

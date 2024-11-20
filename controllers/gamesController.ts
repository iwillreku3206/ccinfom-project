import express, { type Request, type Response } from 'express'
import { isLoggedIn } from './authController'
import { getUserBySession, updateUserProfileBySession } from '../models/user'
import mustache from 'mustache'
import { loadTemplate } from '../util/loadTemplate'
import { createGame } from '../models/games'

export const gamesRouter = express.Router()

gamesRouter.get('/', isLoggedIn, async (req: Request, res: Response) => {
    const user = await getUserBySession(req.cookies?.session || '')

    res.send(mustache.render(await loadTemplate("games"), {
        username: user?.username, displayName: user?.displayName || user?.username
    }))
})

gamesRouter.get('/view', isLoggedIn, async (req: Request, res: Response) => {
    const user = await getUserBySession(req.cookies?.session || '')

    res.send(mustache.render(await loadTemplate("viewGames"), {
        username: user?.username, displayName: user?.displayName || user?.username
    }))
})

gamesRouter.get('/add', isLoggedIn, async (req: Request, res: Response) => {
    const user = await getUserBySession(req.cookies?.session || '')

    let error = ""

    if (user?.userType == 'basic') {
        error = "Error: Only admin accounts can access"
        return res.redirect("/games?error=" + error)
    }

    res.send(mustache.render(await loadTemplate("addGames"), {
        username: user?.username, displayName: user?.displayName || user?.username
    }))
})

gamesRouter.post('/add', isLoggedIn, async (req: Request, res: Response) => {
    try {
        await createGame({name: req.body.name, description: req.body.description})
    } catch(error) {
        res.redirect("/games/add?error=" + error)
    }
    res.redirect("/games")
})
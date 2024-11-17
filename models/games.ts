import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import { db } from "../app/database"
import log from "log"

export interface Games {
    id: number,
    name: string,
    description: string
}

export async function createGame(game: Omit<Games, 'id'>): Promise<Games> {
    const [results, _] = await db.execute<ResultSetHeader>(
        `INSERT INTO \`games\` (name, description) VALUES (?, ?);`
        , [game.name, game.description]
    )
    
    return {
    id: results.insertId,
    ...game,
    }
}

export async function getGameByName(gameName: string): Promise<Games | null> {
    const [results, _] = await db.execute<RowDataPacket[]>(
        `SELECT     id,
                    name,
                    description
        FROM        games
        WHERE       name = ?
        LIMIT       1;`
        , [gameName]
    )

    if (results.length < 1) {
        log.error("no game")
        return null
    }

    if (!results[0].id || !results[0].name || !results[0].description) {
        log.error("invalid game")
        return null
    }
    return results[0] as Games
}
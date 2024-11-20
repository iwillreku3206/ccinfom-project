import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import { db } from "../app/database"
import log from "log"

export interface Items {
    id: number,
    name: string,
    description: string,
    game: number
}

export async function createItem(item: Omit<Items, 'id' | 'game'>, gameId: number): Promise<Items> {
    const [results, _] = await db.execute<ResultSetHeader>(
        `INSERT INTO \`items\` (name, description, game) VALUES (?, ?, ?);`
        , [item.name, item.description, gameId]
    )
    
    return {
    id: results.insertId,
    ...item,
    game: gameId,
    }
}

export async function getItemByName(itemName: string): Promise<Items | null> {
    const [results, _] = await db.execute<RowDataPacket[]>(
        `SELECT     id,
                    name,
                    description,
                    game
        FROM        items
        WHERE       name = ?
        LIMIT       1;`
        , [itemName]
    )

    if (results.length < 1) {
        log.error("no item")
        return null
    }

    if (!results[0].id || !results[0].name || !results[0].description || !results[0].game) {
        log.error("invalid item")
        return null
    }
    return results[0] as Items
}

export async function getItemsByGame(gameName: string): Promise<Items | null> {
    const [results, _] = await db.execute<RowDataPacket[]>(
        `SELECT     id,
                    name,
                    description,
                    game
        FROM        items i
        JOIN        games g
        ON          i.game = g.id
        AND         g.name = ?;`
        , [gameName]
    )

    if (results.length < 1) {
        log.error("no items")
        return null
    }

    return results[0] as Items
}
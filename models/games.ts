import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import { db } from "../app/database"
import Model, { type SQLValueList } from "./model"
import log from "log"

export interface IGames {
    id: number,
    name: string,
    description: string
}

type create_game_spec = Omit<IGames, 'id'>
type get_game_by_name_spec = Pick<IGames, 'name'> 

const create_game_query = `
    INSERT INTO \`games\` 
    (name, description) 
    VALUES (?, ?);
`

const get_game_by_name_query = `
    SELECT      id,
                name,
                description
    FROM        \`games\`
    WHERE       name = ?
    LIMIT       1;
`

const get_all_games_query = `
    SELECT      id,
                name,
                description
    FROM        \`games\`;
`

export default class GamesModel extends Model {
    static #instance: GamesModel

    public static get instance(): GamesModel {
        if (!GamesModel.#instance) {
            GamesModel.#instance = new GamesModel()
        }
        
        return GamesModel.#instance
    }

    private constructor() {
        super()

        super
            .register('create', create_game_query, game => [game.name, game.description])
        super
            .register('get-by-name', get_game_by_name_query, game => [game.name])
    }

    public async createGame(game: create_game_spec) {
        await super.execute('create', game as SQLValueList)
    }

    public async getGameByName(gameName: string): Promise<IGames | null> {
        const results = await super.execute<RowDataPacket[]>('get-by-name', { gameName })
    
        if (results.length < 1) {
            return null
        }
    
        if (!results[0].id || !results[0].name || !results[0].description) {
            log.error("Invalid game: ", JSON.stringify(results[0]))
            return null
        }
        return results[0] as IGames
    }
}

// export async function getAllGames(): Promise<Games | null> {
//     const [results, _] = await db.execute<RowDataPacket[]>(
//         `SELECT     id,
//                     name,
//                     description
//         FROM        games`
//     )

//     if (results.length < 1) {
//         log.error("no games available")
//         return null
//     }

//     return results[0] as Games
// }
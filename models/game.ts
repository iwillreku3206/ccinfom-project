/**
 * @ Author: Group 1
 * @ Create Time: 2024-11-23 02:09:04
 * @ Modified time: 2024-11-23 02:22:45
 * @ Description:
 */

import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import Model, { type SQLValueList } from "./model"

export interface IGame {
    id: number,
    name: string,
    description: string
}

type create_game_spec = Omit<IGame, 'id'>
type get_game_by_name_spec = Pick<IGame, 'name'> 

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

export class GameModel extends Model {
    static #instance: GameModel

    public static get instance(): GameModel {
        if (!GameModel.#instance) {
            GameModel.#instance = new GameModel()
        }
        
        return GameModel.#instance
    }

    private constructor() {
        super()
        super.register('create', create_game_query, game => [ game.name, game.description ])
        super.register('get-by-name', get_game_by_name_query, game => [ game.name ])
    }

    /**
     * Registers a new game into the db.
     * 
     * @param game  The game properties. 
     */
    public async createGame(game: create_game_spec) {
        await this.execute('create', game as SQLValueList)
    }

    /**
     * Grabs all the games in the db.
     * 
     * @returns     All the games in the db. 
     */
    public async getAllGames(): Promise<IGame[]> {
        const results = await this.execute<RowDataPacket[]>('get-all', {})
        return results.map((result: RowDataPacket) => (result as IGame))
    }

    /**
     * Grabs a specific game from the db.
     * 
     * @param gameName  The name of the game to grab. 
     * @returns         The specified game.
     */
    public async getGame(game: get_game_by_name_spec): Promise<IGame | null> {
        const results = await this.execute<RowDataPacket[]>('get-by-name', game)
    
        // Return null or the game retrieved
        if (results.length < 1)
            return null
        return results[0] as IGame
    }
}
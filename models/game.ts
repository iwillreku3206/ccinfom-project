/**
 * @ Author: Group 1
 * @ Create Time: 2024-11-23 02:09:04
 * @ Modified time: 2024-11-23 12:07:50
 * @ Description:
 */

import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import Model, { type SQLValueList } from "./model"
import type { IItem } from "./item"
import ItemModel from "./item"

export interface IGame {
    id: number,
    name: string,
    description: string
}

type create_game_spec = Omit<IGame, 'id'>
type get_game_by_name_spec = Pick<IGame, 'name'> 
type get_game_by_id_spec = Pick<IGame, 'id'> 
type delete_game_spec = Pick<IGame, 'id'>

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
    FROM        \`games\`
    ;
`

const delete_game_query = `
    DELETE 
    FROM        \`games\`
    WHERE       id = ?; 
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
        super.register('get-all', get_all_games_query, _ => [])
        super.register('get-by-name', get_game_by_name_query, game => [ game.name ])
        super.register('delete', delete_game_query, game => [ game.id ])
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

    /**
     * Grabs all the game items.
     * 
     * @param game  Game to get items for.
     * @returns     The items under the game. 
     */
    public async getGameItems(game: get_game_by_id_spec): Promise<IItem[] | null> {
        const results = ItemModel.instance.getItemsByGame({ game: game.id })
        return results
    }

    public async getGameListings() {

    }

    public async deleteGame(game: delete_game_spec) {
        await this.execute('delete', {})
    }
}
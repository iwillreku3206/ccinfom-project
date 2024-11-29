/**
 * @ Author: Group 1
 * @ Create Time: 2024-11-23 02:09:04
 * @ Modified time: 2024-11-24 11:09:56
 * @ Description:
 */

import { type RowDataPacket, type ResultSetHeader, type QueryResult } from "mysql2"
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

const get_game_by_id_query = `
    SELECT      id,
                name,
                description
    FROM        \`games\`
    WHERE       id = ?
    LIMIT       1;
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

const game_sales_report = `
    SELECT      g.id as gameID,
                g.name as gameName,
                MONTHNAME(sl.buy_date) as month,
                SUM(l.price) as totalSales
    FROM        games g
    LEFT JOIN   items i
        ON      i.game = g.id
    LEFT JOIN   listings l
        ON      l.item = i.id
        AND     l.sold = 1
    LEFT JOIN   sold_listings sl
        ON      sl.listing = l.id
    WHERE       g.id = ?
        AND     YEAR(sl.buy_date) = ?
    GROUP BY    g.id, month
    ORDER BY    totalSales DESC;
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
        super.register('get-by-id', get_game_by_id_query, game => [ game.id ])
        super.register('get-by-name', get_game_by_name_query, game => [ game.name ])
        super.register('delete', delete_game_query, game => [ game.id ])
        super.register('salesreport', game_sales_report, l => [l.gameId, l.year])
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
    public async getGame(game: get_game_by_id_spec): Promise<IGame | null> {
        const results = await this.execute<RowDataPacket[]>('get-by-id', game)
    
        // Return null or the game retrieved
        if (results.length < 1)
            return null
        return results[0] as IGame
    }

    /**
     * Grabs a specific game from the db.
     * 
     * @param gameName  The name of the game to grab. 
     * @returns         The specified game.
     */
    public async getGameByName(game: get_game_by_name_spec): Promise<IGame | null> {
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

    public async deleteGame(game: delete_game_spec): Promise<QueryResult | null> {
        return await this.execute('delete', game)
    }

    public async gameSalesReport(gameId: number, year: number): Promise<{gameId: number, gameName: string, monthName: string, totalSales: number}[]> {
        return await this.execute('salesreport', { gameId, year }) as {gameId: number, gameName: string, monthName: string, totalSales: number}[]
    }
}
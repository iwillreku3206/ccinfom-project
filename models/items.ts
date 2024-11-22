import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import { db } from "../app/database"
import Model, { type SQLValueList } from "./model"
import log from "log"

export interface IItems {
    id: number,
    name: string,
    description: string,
    game: number
}

type create_item_spec = Omit<IItems, 'id'>
type get_item_by_name_spec = Pick<IItems, 'name'>
type get_items_by_game_spec = {gameId: number}

const create_item_query = `
    INSERT INTO \`items\` 
    (name, description, game) 
    VALUES (?, ?, ?);
`

const get_item_by_name_query = `
    SELECT      id,
                name,
                description,
                game
    FROM        \`items\`
    WHERE       name = ?
`

const get_items_by_game_query = `
    SELECT      id,
                name,
                description,
                game
    FROM        \`items\` i
    JOIN        \`games\` g
    ON          i.game = g.id
    AND         g.name = ?;
`

const get_all_items = `
    SELECT      id,
                name,
                description,
                game
    FROM        \`items\`;
`

export default class ItemModel extends Model {
    static #instance: ItemModel

    public static get instance(): ItemModel {
        if (!ItemModel.#instance) {
            ItemModel.#instance = new ItemModel()
        }

        return ItemModel.#instance
    }

    private constructor() {
        super()

        super
            .register('create', create_item_query, item => [item.name, item.description, item.game])
        super
            .register('get-by-name', get_item_by_name_query, item => [item.name])
        super
            .register('get-by-game', get_items_by_game_query, item => [item.gameName])
    }

    public async createItem(item: create_item_spec) {
        await super.execute('create', item as SQLValueList)
    }

    public async getItemByName(itemName: string): Promise<IItems | null> {
        const results = await super.execute<RowDataPacket[]>("get-by-name", {itemName})
    
        if (results.length < 1) {
            return null
        }
    
        if (!results[0].id || !results[0].name || !results[0].description || !results[0].game) {
            log.error("Invalid item: ", JSON.stringify(results[0]))
            return null
        }

        return results[0] as IItems
    }

    public async getItemsByGame(gameName: string): Promise<IItems | null> {
        const results = await super.execute<RowDataPacket[]>("get-by-game", {gameName})

        if (results.length < 1) {
            return null
        }

        return results[0] as IItems
    }
}

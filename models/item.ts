import { type RowDataPacket, type ResultSetHeader, type QueryResult } from "mysql2"
import { db } from "../app/database"
import Model, { type SQLValueList } from "./model"
import log from "log"

export interface IItem {
    id: number,
    name: string,
    description: string,
    game: number
}

type create_item_spec = Omit<IItem, 'id'>
type get_item_by_name_spec = Pick<IItem, 'name'>
type get_items_by_game_spec = { game: number }

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
        super.register('create', create_item_query, item => [ item.name, item.description, item.game ])
        super.register('get-by-name', get_item_by_name_query, item => [ item.name ])
        super.register('get-by-game', get_items_by_game_query, item => [ item.gameName ])
    }

    public async createItem(item: create_item_spec) {
        await super.execute('create', item as SQLValueList)
    }

    public async getItemByName(item: get_item_by_name_spec): Promise<IItem | null> {
        const results = await super.execute<RowDataPacket[]>("get-by-name", item)
    
        if (results.length < 1) {
            return null
        }
    
        if (!results[0].id || !results[0].name || !results[0].description || !results[0].game) {
            log.error("Invalid item: ", JSON.stringify(results[0]))
            return null
        }

        return results[0] as IItem
    }

    public async getItemsByGame(item: get_items_by_game_spec): Promise<IItem[] | null> {
        const results = await super.execute<RowDataPacket[]>("get-by-game", item)

        if (results.length < 1)
            return null
        return results.map((r: RowDataPacket) => (r as IItem))
    }
}

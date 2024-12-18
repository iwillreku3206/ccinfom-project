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
type get_item_by_id_spec = Pick<IItem, 'id'>
type get_item_by_name_spec = Pick<IItem, 'name'>
type get_items_by_game_spec = { game: number }
type delete_item = Pick<IItem, 'id'>

const create_item_query = `
    INSERT INTO \`items\` 
    (name, description, game) 
    VALUES (?, ?, ?);
`

const get_all_item_query = `
    SELECT * FROM \`items\`;
`

const get_item_by_id_query = `
    SELECT      id,
                name,
                description,
                game
    FROM        \`items\`
    WHERE       id = ?
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
    SELECT      i.id,
                i.name,
                i.description,
                i.game
    FROM        \`items\` i
    JOIN        \`games\` g
    ON          i.game = g.id
    AND         g.id = ?;
`

const get_all_items = `
    SELECT      id,
                name,
                description,
                game
    FROM        \`items\`;
`

const delete_item_query = `
    DELETE
    FROM        \`items\`
    WHERE       id = ?;
`

const get_all_items_with_game_name = `
    SELECT      i.id AS id,
                i.name AS name,
                i.description AS description,
                g.name AS game
    FROM        \`items\` i
    JOIN        games g
        ON      g.id = i.game;
`

const get_items_with_game_name_from_id = `
    SELECT      i.id AS id,
                i.name AS name,
                i.description AS description,
                g.name AS game
    FROM        \`items\` i
    JOIN        games g
        ON      g.id = i.game
    WHERE       i.id = ?;
`

const items_listed_report = `
    SELECT      i.id as itemID,
                i.name as itemName, 
                MONTHNAME(l.list_date) as month,
                COUNT(l.id) as listingCount
    FROM        items i
    LEFT JOIN   listings l
        ON      l.item = i.id
    WHERE       i.id = ?
        AND     YEAR(l.list_date) = ?
    GROUP BY    i.name, month
    ORDER BY    listingCount DESC;
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
    super.register('create', create_item_query, item => [item.name, item.description, item.game])
    super.register('get-all', get_all_items, _ => [])
    super.register('get-by-id', get_item_by_id_query, item => [item.id])
    super.register('get-by-name', get_item_by_name_query, item => [item.name])
    super.register('get-all-with-gamename', get_all_items_with_game_name, _ => [])
    super.register('get-by-game', get_items_by_game_query, item => [item.game])
    super.register('delete', delete_item_query, item => [item.id])
    super.register('get_items_with_game_name_from_id ', get_items_with_game_name_from_id, item => [item.id])
    super.register('listingreport', items_listed_report, l => [l.itemId, l.year])
  }

  public async createItem(item: create_item_spec) {
    await super.execute('create', item as SQLValueList)
  }

  public async getItem(item: get_item_by_id_spec) {
    const results = await super.execute<RowDataPacket[]>("get-by-id", item)
    if (results.length < 1) {
      return null
    }

    if (!results[0].id || !results[0].name || !results[0].description || !results[0].game) {
      log.error("Invalid item: ", JSON.stringify(results[0]))
      return null
    }

    return results[0] as IItem
  }

  public async getAllItems(): Promise<IItem[]> {
    const results = await super.execute<RowDataPacket[]>("get-all", {})
    return results.map((r: RowDataPacket) => (r as IItem))
  }

  public async getAllItemsWithGameName(): Promise<(Omit<IItem, "game"> & { game: string })[]> {
    const results = await super.execute<RowDataPacket[]>("get-all-with-gamename", {})
    return results.map((r: RowDataPacket) => (r as (Omit<IItem, "game"> & { game: string })))
  }

  public async getItemWithGameNameById(id: number): Promise<(Omit<IItem, "game"> & { game: string }) | null> {
    const results = await super.execute<RowDataPacket[]>("get-all-with-gamename", { id })
    if (results.length < 0) {
      return null
    }
    return results.map((r: RowDataPacket) => (r as (Omit<IItem, "game"> & { game: string })))[0]
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

  public async deleteItem(item: delete_item) {
    return await super.execute('delete', item)
  }

  public async getItemsByGame(item: get_items_by_game_spec): Promise<IItem[] | null> {
    const results = await super.execute<RowDataPacket[]>("get-by-game", item)

    if (results.length < 1)
      return null
    return results.map((r: RowDataPacket) => (r as IItem))
  }

  public async itemsListedReport(itemId: number, year: number): Promise<{itemId: number, itemName: string, monthName: string, listingCount: number}[]> {
    return await this.execute('listingreport', { itemId, year }) as {itemId: number, itemName: string, monthName: string, listingCount: number}[]
  }
}

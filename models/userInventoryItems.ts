import argon2 from 'argon2'
import log from "log"
import { type ResultSetHeader, type RowDataPacket } from "mysql2"
import { db } from "../app/database"
import Model from "./model";

export interface UserInventoryItems{
  id: number,
  user: number, 
  item: number, 
  obtained_on: Date
}

// all queries
const SQLCODE = Object.freeze({
  create            : `INSERT INTO \`inventory_items\` (user, item, obtained_on) VALUES (?, ?, ?);`
  , get_all         : `SELECT id, user, item, obtained_on FROM \`inventory_items\`;`
  , get_user        : `SELECT id, user, item, obtained_on FROM \`inventory_items\` WHERE user = ?;`
  , get_user_item   : `SELECT id, user, item, obtained_on FROM \`inventory_items\` WHERE user = ? AND item = ?;`
  , get_item        : `SELECT id, user, item, obtained_on FROM \`inventory_items\` WHERE item = ?;` 
  , get_date        : `SELECT id, user, item, obtained_on FROM \`inventory_items\` WHERE obtained_on BETWEEN ? AND ?;` 
})

/**
 * Checks if given input fits the UserInventoryItems description
 * @param item 
 * @returns Boolean
 */
function isInvalidInventoryItem(item: any){
  return !("id" in item) || !("user" in item) || !("item" in item) || !("obtained_on" in item)
}

// The model to use
export default class UserInventoryItemModel extends Model {
  static #instance: UserInventoryItemModel

  public static get instance(): UserInventoryItemModel {
    if (!UserInventoryItemModel.#instance) {
      UserInventoryItemModel.#instance = new UserInventoryItemModel()
    }

    return UserInventoryItemModel.#instance
  }

  private constructor() {
    super()
    // Register the queries
    super.register('create', SQLCODE[`create`], inventoryitem => [inventoryitem.user, inventoryitem.item, inventoryitem.date_added])
    super.register('get-all', SQLCODE[`get_all`], _ => [])
    super.register('get-by-user', SQLCODE[`get_user`], inventoryitem => [inventoryitem.user])
    super.register('get-by-user-and-item', SQLCODE[`get_user_item`], inventoryitem => [inventoryitem.user, inventoryitem.item])
    super.register('get-by-item', SQLCODE[`get_item`], inventoryitem => [inventoryitem.item])
    super.register('get-by-date', SQLCODE[`get_date`], inventoryitem => [inventoryitem.min, inventoryitem.max])
  }


  /**
   * Adds new inventory items
   * @param item Item with user and item
   * @returns Promise<UserInventoryItems>
   */
  async createInventoryItem(item: Omit<UserInventoryItems, 'id'>): Promise<void>{
     await this.execute("create", item)

  }

  /**
   * Returns an array of UserInventoryItems that fits the description
   * @param userId number - user id to select from
   * @param itemId number - item id to select from
   * @returns Promise<UserInventoryItems[] | null>{
   */
  async getFilteredInventoryItems(filter: string, ...values: any): Promise<UserInventoryItems[] | null>{
    let results = null;

    switch (filter) {
      case 'user': results = await this.execute<RowDataPacket[]>('get-by-user', { user: values[0] }); break;
      case 'user_and_item': results = await this.execute<RowDataPacket[]>('get-by-user-and-item', { user: values[0], item: values[1] }); break;
      case 'item': results = await this.execute<RowDataPacket[]>('get-by-item', { item: values[0] }); break;
      case 'date': results = await this.execute<RowDataPacket[]>('get-by-date', { min: values[0], max: values[1]}); break;
    }

    if (results?.length == 0) {
      log.error("No Items")
    }
    
    return results?.map((item: RowDataPacket) => (item as UserInventoryItems)) as UserInventoryItems[] ?? null
  }


  /**
   * Returns an array of UserInventoryItems that fits the given userId
   * @param userId number - user id to select from
   * @returns Promise<UserInventoryItems[] | null>{
   */
  async getAllInventoryItems(): Promise<UserInventoryItems[]>{
    let results = await super.execute<RowDataPacket[]>(`get-all`, {})
    const itemList: UserInventoryItems[] = results.map((item: RowDataPacket) => (item as UserInventoryItems))
    
    return itemList
  }

}





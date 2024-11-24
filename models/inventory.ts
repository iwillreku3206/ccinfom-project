import argon2 from 'argon2';
import log from "log";
import { type QueryResult, type ResultSetHeader, type RowDataPacket } from "mysql2";
import { db } from "../app/database";
import Model from "./model";
import ListingModel from './listing';

export interface UserInventoryItem{
  id: number,
  user: number, 
  item: number, 
  obtained_on: Date
}

export interface InventoryItem{
  id: number,
  game_name: string,
  user_name: string,
  item_name: string,
  item_description: string,
  obtained_on: string,
}

// all queries
const SQLCODE = Object.freeze({
  create            : `INSERT INTO \`inventory_items\` (user, item) VALUES (?, ?);`,
  create_past       : `INSERT INTO \`inventory_items\` (user, item) VALUES (?, ?);`
  , get_all         : `SELECT 
  uii.id AS 'id',
	g.name AS 'game_name',
    u.username As 'user_name',
    i.name AS 'item_name',
    i.description AS 'item_description',
    uii.obtained_on AS 'obtained_on'
FROM \`inventory_items\` uii
JOIN \`items\` i
ON i.id = uui.item
JOIN \`games\` g
ON g.id = i.game
JOIN \`users\` u
ON u.id = uii.user;`
  , get_id: `SELECT
  * FROM \`inventory_items\`
  WHERE id = ?;  
`
  , get_user        : `SELECT 
	uii.id AS 'id',
  g.name AS 'game_name',
    u.username As 'user_name',
    i.name AS 'item_name',
    i.description AS 'item_description',
    uii.obtained_on AS 'obtained_on'
FROM \`inventory_items\` uii
JOIN \`items\` i
ON i.id = uii.item
JOIN \`games\` g
ON g.id = i.game
JOIN \`users\` u
ON u.id = uii.user WHERE user = ?;`
  , get_user_item   : `SELECT 
  uii.id AS 'id',
	g.name AS 'game_name',
    u.username As 'user_name',
    i.name AS 'item_name',
    i.description AS 'item_description',
    uii.obtained_on AS 'obtained_on'
FROM \`inventory_items\` uii
JOIN \`items\` i
ON i.id = uii.item
JOIN \`games\` g
ON g.id = i.game
JOIN \`users\` u
ON u.id = uii.user WHERE user = ? AND item = ?;`
  , get_item        : `SELECT 
  uii.id AS 'id',
	g.name AS 'game_name',
    u.username As 'user_name',
    i.name AS 'item_name',
    i.description AS 'item_description',
    uii.obtained_on AS 'obtained_on'
FROM \`inventory_items\` uii
JOIN \`items\` i
ON i.id = uii.item
JOIN \`games\` g
ON g.id = i.game
JOIN \`users\` u
ON u.id = uii.user WHERE item = ?;` 
  , get_date        : `SELECT 
  uii.id AS 'id',
	g.name AS 'game_name',
    u.username As 'user_name',
    i.name AS 'item_name',
    i.description AS 'item_description',
    uii.obtained_on AS 'obtained_on'
FROM \`inventory_items\` uii
JOIN \`items\` i
ON i.id = uii.item
JOIN \`games\` g
ON g.id = i.game
JOIN \`users\` u
ON u.id = uii.user WHERE obtained_on BETWEEN ? AND ?;`
  , delete:  
  `
DELETE FROM \`inventory_items\`
  WHERE id = ?;
  `
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
    super.register('create', SQLCODE[`create`], inventoryitem => [inventoryitem.user, inventoryitem.item])
    super.register('create-past', SQLCODE[`create_past`], inventoryitem => [inventoryitem.user, inventoryitem.item])
    super.register('get-all', SQLCODE[`get_all`], _ => [])
    super.register('get-by-id', SQLCODE['get_id'], inventoryItem => [inventoryItem.id])
    super.register('get-by-user', SQLCODE[`get_user`], inventoryitem => [inventoryitem.user])
    super.register('get-by-user-and-item', SQLCODE[`get_user_item`], inventoryitem => [inventoryitem.user, inventoryitem.item])
    super.register('get-by-item', SQLCODE[`get_item`], inventoryitem => [inventoryitem.item])
    super.register('get-by-date', SQLCODE[`get_date`], inventoryitem => [inventoryitem.min, inventoryitem.max])
    super.register('delete', SQLCODE[`delete`], inventoryItem => [ inventoryItem.id ])
  }


  /**
   * Adds new inventory items
   * @param item Item with user and item
   * @returns Promise<UserInventoryItems>
   */
  public async create(item: Omit<UserInventoryItem, 'id' | 'obtained_on'>): Promise<void>{
     await this.execute("create", item)
  }

  /**
   * Adds lost inventory items
   * @param item Item with user and item
   * @returns Promise<UserInventoryItems>
   */
  public async createPast(item: Omit<UserInventoryItem, 'id' | 'obtained_on'>): Promise<void>{
    await this.execute("create-past", item)
 }

  public async getInventoryItem(item: { id: number }): Promise<UserInventoryItem | null> {
    const results = await this.execute<RowDataPacket[]>('get-by-id', item)
    return results && results.length 
      ? results[0] as UserInventoryItem 
      : null;
  }

  /**
   * Returns an array of UserInventoryItems that fits the description
   * @param userId number - user id to select from
   * @param itemId number - item id to select from
   * @returns Promise<UserInventoryItems[] | null>{
   */
  public async getFilteredInventoryItems(filter: string, ...values: any): Promise<InventoryItem[] | null>{
    let results = null;

    switch (filter) {
      case 'user': results = await this.execute<RowDataPacket[]>('get-by-user', { user: values[0] }); break;
      case 'user_and_item': results = await this.execute<RowDataPacket[]>('get-by-user-and-item', { user: values[0], item: values[1] }); break;
      case 'item': results = await this.execute<RowDataPacket[]>('get-by-item', { item: values[0] }); break;
      case 'date': results = await this.execute<RowDataPacket[]>('get-by-date', { min: values[0], max: values[1]}); break;
    }

    log.info(results)
    if (results?.length == 0) {
      log.warn("No Items")
    }
    
    return results?.map((item: RowDataPacket) => (item as InventoryItem)) as InventoryItem[] ?? null
  }


  /**
   * Returns an array of UserInventoryItems that fits the given userId
   * @param userId number - user id to select from
   * @returns Promise<UserInventoryItems[] | null>{
   */
  public async getAllInventoryItems(): Promise<InventoryItem[]>{
    let results = await super.execute<RowDataPacket[]>(`get-all`, {})
    const itemList: InventoryItem[] = results.map((item: RowDataPacket) => (item as InventoryItem))
    
    return itemList
  }

  /**
   * Sells a user's inventory item.
   * @param item 
   * @returns 
   */
  public async sellInventoryItem(item: { id: number, price: number }) {
    
    // Grab existing entry first
    const inventoryItem = await this.getInventoryItem({ id: item.id  });
    
    // Invalid inv item to sell
    if(!inventoryItem) return; 

    // Create a past inv item
    await this.execute('create-past', { item: inventoryItem.item, user: inventoryItem.user })

    // Create a new listing
    await ListingModel.instance.createListing({ item: inventoryItem.item, seller: inventoryItem.user, price: item.price })

    // Delete old inv item
    await this.delete({ id: item.id })
  }

  public async delete(item: { id: number }): Promise<QueryResult | null> {
    return await this.execute('delete', item);
  }
}





import argon2 from 'argon2'
import log from "log"
import { type ResultSetHeader, type RowDataPacket } from "mysql2"
import { db } from "../app/database"

export interface UserInventoryItems{
  id: number,
  user: number, 
  item: number, 
  obtained_on: Date
}

const SQLCODE = Object.freeze({
  ADDITEM        : `INSERT INTO \`inventory_items\`
                    (user, item, obtained_on)
                    VALUES (?, ?, ?);`
  , SELUSERITEM  : `SELECT      id, user, item,obtained_on
                    FROM        \`inventory_id\`
                    WHERE       user = ? 
                    AND   item = ?`
  , SELUSER      : `SELECT      id, user, item, obtained_on
                    FROM        \`inventory_items\`
                    WHERE       user = ?;`
  , UPDUSER      : `UPDATE  \`inventory_items\` 
                    SET   user = ?
                    ON    id = ?;`
  , UPDITEM      : `UPDATE  \`inventory_items\` 
                    SET   item = ?
                    ON    id = ?;`
})

/**
 * Checks if given input fits the UserInventoryItems description
 * @param item 
 * @returns Boolean
 */
function isInvalidInventoryItem(item: any){
  return !("id" in item) || !("user" in item) || !("item" in item) || !("obtained_on" in item)
}

/**
 * Adds new inventory items
 * @param item Item with user and item
 * @returns Promise<UserInventoryItems>
 */
export async function addInventoryItem(item: Omit<UserInventoryItems, 'id' | 'obtained_on'>): Promise<UserInventoryItems>{
  let date_added = new Date();

  const [results, _] = await db.execute<ResultSetHeader>(SQLCODE["ADDITEM"], [item.user, item.item, date_added])

  return {
    id: results.insertId,
    obtained_on: date_added,
    ...item,
  }
}

/**
 * Returns an array of UserInventoryItems that fits the description
 * @param userId number - user id to select from
 * @param itemId number - item id to select from
 * @returns Promise<UserInventoryItems[] | null>{
 */
export async function getInventoryItemByUserIdAndItemId(userId: number, itemId: number): Promise<UserInventoryItems[] | null>{
  const [results, _] = await db.execute<RowDataPacket[]>(SQLCODE["SELUSERITEM"], [userId, itemId])

  console.log(results)

  if (results.length < 1) {
    log.error("no item")
    return null
  }

  const invalid_items = results.filter(isInvalidInventoryItem)
  const valid_items = results.filter(x => !invalid_items.includes(x))

  if (invalid_items.length >= 1){
    log.error("Invalid user inventory item: ", JSON.stringify(invalid_items))
    return null
  }
  
  return valid_items as UserInventoryItems[]
}


/**
 * Returns an array of UserInventoryItems that fits the given userId
 * @param userId number - user id to select from
 * @returns Promise<UserInventoryItems[] | null>{
 */
export async function getInventoryItemByUserId(userId: number): Promise<UserInventoryItems[] | null>{
  const [results, _] = await db.execute<RowDataPacket[]>(SQLCODE["SELUSER"], [userId])

  console.log(results)

  if (results.length < 1) {
    log.error("no item")
    return null
  }

  const invalid_items = results.filter(isInvalidInventoryItem)
  const valid_items = results.filter(x => !invalid_items.includes(x))

  if (invalid_items.length >= 1){
    log.error("Invalid user inventory item: ", JSON.stringify(invalid_items))
    return null
  }  
  
  return valid_items as UserInventoryItems[]
}

/**
 * Updates the given inventory item in the database to a new userId
 * @param inventoryId 
 * @param userId 
 */
export async function updateUserIdByUserId(inventoryId: number, userId: number){
  if (userId == 0) 
    throw new Error("User id cannot be 0")

  const [_, __] = await db.execute<ResultSetHeader>(SQLCODE["UPDUSER"], [userId, inventoryId])

}

/**
 * Updates the given inventory item in the database to a new itemId
 * @param inventoryId 
 * @param itemId 
 */
export async function updateUserIdByItemId(inventoryId: number, itemId: number){
  if (itemId == 0) 
    throw new Error("Item id cannot be 0")
  
  const [_, __] = await db.execute<ResultSetHeader>(SQLCODE["UPDITEM"], [itemId, inventoryId])

}
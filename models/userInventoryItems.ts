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


function isInvalidInventoryItem(item: any){
  return !("id" in item) || !("user" in item) || !("item" in item) || !("obtained_on" in item)
}

/**
 * Adds inventory items
 * @param item Item with user and item
 * @returns 
 */
export async function addInventoryItem(item: Omit<UserInventoryItems, 'id' | 'obtained_on'>): Promise<UserInventoryItems>{
  let date_added = new Date();

  const [results, _] = await db.execute<ResultSetHeader>(`
    INSERT INTO \`inventory_items\`
      (user, item, obtained_on)
      VALUES (?, ?, ?);
  `, [item.user, item.item, date_added])

  return {
    id: results.insertId,
    obtained_on: date_added,
    ...item,
  }
}

export async function getInventoryItemByUserIdAndItemId(userId: number, itemId: number): Promise<UserInventoryItems | null>{
  const [results, _] = await db.execute<RowDataPacket[]>(`
    SELECT      id, 
                user,
                item,
                obtained_on
    FROM        \`inventory_id\`
    WHERE       user = ? 
          AND   item = ?
    LIMIT 1;
    `, [userId, itemId]
  )

  if (results.length < 1) {
    log.error("no item")
    return null
  }

  if (isInvalidInventoryItem(results[0])){
    log.error("Invalid user inventory item: ", JSON.stringify(results[0]))
    return null
  }

  return results[0] as UserInventoryItems
}

export async function getInventoryItemByUserId(userId: number): Promise<UserInventoryItems[] | null>{
  const [results, _] = await db.execute<RowDataPacket[]>(`
    SELECT      id, 
                user,
                item,
                obtained_on
    FROM        \`inventory_items\`
    WHERE       user = ?;
    `, [userId]
  )

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

export async function updateUserIdByUserId(inventoryId: number, userId: number){
  if (userId == 0) 
    throw new Error("User id cannot be 0")

  const [_, __] = await db.execute<ResultSetHeader>(`
    UPDATE  \`inventory_items\` 
      SET   user = ?
      ON    id = ?;
    `, [userId, inventoryId])

}

export async function updateUserIdByItemId(inventoryId: number, item: number){
  if (item == 0) 
    throw new Error("Item id cannot be 0")
  
  const [_, __] = await db.execute<ResultSetHeader>(`
    UPDATE  \`inventory_items\` 
      SET   item = ?
      ON    id = ?;
    `, [item, inventoryId])

}
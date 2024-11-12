import { type ResultSetHeader } from "mysql2"
import { db } from "../app/database"

export interface User {
  id: number,
  username: string,
  displayName: string,
  balance: number,
  userType: 'basic' | 'admin'
  password_hash: string
}

export async function createUser(user: Omit<User, 'id' | 'balance'>): Promise<User> {
  const [results, _] = await db.execute<ResultSetHeader>(`
    INSERT  INTO \`users\` 
      (username, display_name, user_type, password_hash) 
      VALUES (?, ?, ?, ?);
    `, [user.username, user.displayName, user.userType, user.password_hash])
  return {
    id: results.insertId,
    balance: 200,
    ...user,
  }
}

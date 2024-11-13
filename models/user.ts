import { type RowDataPacket, type ResultSetHeader } from "mysql2"
import { db } from "../app/database"
import log from "log"

export interface User {
  id: number,
  username: string,
  displayName: string,
  balance: number,
  userType: 'basic' | 'admin'
  passwordHash: string
}

export async function createUser(user: Omit<User, 'id' | 'balance'>): Promise<User> {
  const [results, _] = await db.execute<ResultSetHeader>(`
    INSERT INTO \`users\` 
      (username, display_name, user_type, password_hash) 
      VALUES (?, ?, ?, ?);
    `, [user.username, user.displayName, user.userType, user.passwordHash])

  return {
    id: results.insertId,
    balance: 200,
    ...user,
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const [results, _] = await db.execute<RowDataPacket[]>(`
    SELECT    id,
              username,
              display_name AS displayName,
              balance,
              user_type AS userType,
              password_hash AS passwordHash
    FROM      users
    WHERE     username = ?
    LIMIT     1;
  `, [username])

  if (results.length < 1)
    return null

  if (!results[0].id || !results[0].username || !results[0].displayName || !results[0].balance || !results[0].userType || !results[0].passwordHash) {
    log.error("Invalid user: ", JSON.stringify(results[0]))
    return null
  }
  return results[0] as User
}

export async function getUserBySession(sessionId: string): Promise<User | null> {
  const [results, _] = await db.execute<RowDataPacket[]>(`
    SELECT    u.id AS id
              u.username AS username,
              u.display_name AS displayName
              u.balance AS balance,
              u.user_type AS userType,
              u.password_hash AS passwordHash
    FROM      sessions s
    JOIN      users u
          ON  s.user = u.id
    WHERE     s.expiry > NOW()
    LIMIT 1;
  `)


}

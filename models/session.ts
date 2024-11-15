import type { ResultSetHeader } from "mysql2";
import type { User } from "./user";
import { db } from "../app/database";
import crypto from 'crypto'
import log from "log";
import { UAParser } from "ua-parser-js";

export interface Session {
  id: number,
  user: User,
  expiry: Date
}

export interface LoginHistory {
  id: number,
  session: string,
  login_on: Date,
  browser: string,
  platform: string
}

export async function createSession(userId: number, userAgent: string, retries = 3): Promise<{ id: string, expiry: Date }> {
  if (retries < 0) {
    throw new Error("createSession: max retries reached")
  }
  const id = crypto.randomBytes(32).toString('hex')
  const expiry = new Date((new Date()).getTime() + 1000 * 60 * 60 * 24 * 30)

  // parse user agent
  const ua = new UAParser(userAgent)

  console.log([id,
    userId,
    expiry,
    id,
    ua.getBrowser().name || '',
    ua.getOS().name || ''])
  // https://stackoverflow.com/a/3164595
  // https://stackoverflow.com/questions/5178697/mysql-insert-into-multiple-tables-database-normalization
  const [results, _] = await db.execute<ResultSetHeader>(`
    INSERT INTO \`sessions\` 
      (id, user, expiry) 
      VALUES (?, ?, ?);
    `, [id, userId, expiry]) 

  const [results2, __] = await db.execute<ResultSetHeader>(`
    INSERT INTO \`login_history\`
      (session, browser, platform)
      VALUES (?, ?, ?);
  `,
    [id, ua.getBrowser().name || '', ua.getOS().name || ''])

  if (results2.affectedRows < 1) {
    log.error("Unable to log user login to database")
  }
  if (results.affectedRows < 1) {
    log.error("Unable to create session")
    return createSession(userId, userAgent, retries - 1)
  }
  return { id, expiry }
}

export async function expireSession(sessionId: string): Promise<void> {
  const [_, __] = await db.execute<ResultSetHeader>(`
    UPDATE \`sessions\`
    SET     expiry = NOW()
    WHERE   id = ?;
  `, [sessionId])
}

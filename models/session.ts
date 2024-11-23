import type { ResultSetHeader } from "mysql2";
import type { IUser } from "./user";
import { db } from "../app/database";
import crypto from 'crypto'
import log from "log";
import { UAParser } from "ua-parser-js";
import Model from "./model";
import { which } from "bun";

export interface ISession {
  id: number,
  user: IUser,
  expiry: Date
}

export interface ILoginHistory {
  id: number,
  session: string,
  login_on: Date,
  browser: string,
  platform: string
}

// Different types / specs
type create_session_spec = Omit<ISession, 'user'> & { userId: number }
type create_login_spec = Omit<ILoginHistory, 'id' | 'login_on'>
type expire_session_spec = Pick<ISession, 'id'>

// The queries for the model
const create_session_query = `
  INSERT INTO \`sessions\` (id, user, expiry) 
    VALUES (?, ?, ?);
`

const create_login_query = `
  INSERT INTO \`login_history\` (user, browser, platform)
    VALUES (?, ?, ?);
`

const expire_session_query = `
  UPDATE \`sessions\`
    SET     expiry = NOW()
    WHERE   id = ?;
`

export default class SessionModel extends Model {
  static #instance: SessionModel

  public static get instance(): SessionModel {
    if (!SessionModel.#instance) {
      SessionModel.#instance = new SessionModel()
    }

    return SessionModel.#instance
  }

  private constructor() {
    super()
    super
      .register('create-session', create_session_query,
        session => [session.id, session.userId, session.expiry])
    super
      .register('create-login', create_login_query,
        login => [login.user, login.browser, login.platform])
    super
      .register('expire', expire_session_query, session => [session.id])
  }

  public async createSession(userId: number, userAgent: string, retries = 3): Promise<{
    id: string, expiry: Date
  }> {
    if (retries < 0) {
      throw new Error("createSession: max retries reached")
    }
    const id = crypto.randomBytes(32).toString('hex')
    const expiry = new Date((new Date()).getTime() + 1000 * 60 * 60 * 24 * 30)

    // parse user agent
    const ua = new UAParser(userAgent)

    const results = await super.execute<ResultSetHeader>('create-session', {
      id, userId, expiry
    })
    const results2 = await super.execute<ResultSetHeader>('create-login', {
      user: userId, browser: ua.getBrowser().name || '', platform: ua.getOS().name || ''
    })
    if (results2.affectedRows < 1) {
      log.error("Unable to log user login to database")
    }
    if (results.affectedRows < 1) {
      log.error("Unable to create session")
      return this.createSession(userId, userAgent, retries - 1)
    }
    return { id, expiry }
  }

  public async expireSession(sessionId: string) {
    await super.execute('expire', { id: sessionId })
  }
}



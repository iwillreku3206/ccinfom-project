import type { ResultSetHeader } from "mysql2";
import type { User, IUser } from "./user";
import { db } from "../app/database";
import crypto from 'crypto'
import log from "log";
import { UAParser } from "ua-parser-js";
import { Model } from "./model";

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

export const Session = Model()

// Different types / specs
type create_session_spec  = Omit<ISession, 'user'> & { userId: number }
type create_login_spec    = Omit<ILoginHistory, 'id' | 'login_on'>
type expire_session_spec  = Pick<ISession, 'id'>

// The queries for the model
const create_session_query = `
  INSERT INTO \`sessions\` (id, user, expiry) 
    VALUES (?, ?, ?);
`

const create_login_query = `
  INSERT INTO \`login_history\` (session, browser, platform)
    VALUES (?, ?, ?);
`

const expire_session_query = `
  UPDATE \`sessions\`
    SET     expiry = NOW()
    WHERE   id = ?;
`

// https://stackoverflow.com/a/3164595
// https://stackoverflow.com/questions/5178697/mysql-insert-into-multiple-tables-database-normalization
Session
  .register('create', [ create_session_query, create_login_query ], [ 
    (session: create_session_spec) => [ session.id, session.userId, session.expiry ],
    (login: create_login_spec) => [ login.session, login.browser, login.platform ] ])
  .register('expire', expire_session_query, (session: expire_session_spec) => [ session.id ])

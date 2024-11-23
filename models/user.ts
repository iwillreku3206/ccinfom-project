import argon2 from "argon2"
import { type RowDataPacket } from "mysql2"
import Model, { type SQLValueList } from "./model"
import log from "log"
import type { IListing } from "./listing"
import type { UserInventoryItems } from "./userInventoryItems"

export interface IUser {
  id: number,
  username: string,
  displayName: string,
  balance: number,
  userType: 'basic' | 'admin'
  passwordHash: string
};

export interface IUserProfile {
  id: number
  username: string,
  displayName: string,
  balance: number,
  userType: 'basic' | 'admin',
  listings: IUserProfileListing[],
  inventory: IUserProfileInventoryItem[],
}

export interface IUserProfileListing {
  id: number,
  name: string,
  gameName: string,
  price: number,
  date: Date
}

export interface IUserProfileInventoryItem {
  name: string,
  gameName: string,
  obtainedOn: Date
}

// Specs
type create_user_spec = Omit<IUser, 'id' | 'balance'>
type get_user_by_username_spec = Pick<IUser, 'username'>
type get_user_by_session_spec = { sessionId: string }
type update_user_profile_by_session_spec = Pick<IUser, 'username' | 'displayName'> & { sessionId: string }
type update_user_password_by_session_spec = Pick<IUser, 'passwordHash'> & { sessionId: string }

// The model queries
const create_user_query = `
  INSERT INTO \`users\` (username, display_name, user_type, password_hash) 
  VALUES (?, ?, ?, ?);
`;

const get_user_by_username_query = `
  SELECT  id, 
          username,
          display_name AS displayName,
          balance,
          user_type AS userType,
          password_hash AS passwordHash
  FROM    \`users\`
  WHERE   username = ?
  LIMIT   1;
`

const get_user_by_session_query = `
  SELECT  u.id AS id,
          u.username AS username,
          u.display_name AS displayName,
          u.balance AS balance,
          u.user_type AS userType,
          u.password_hash AS passwordHash
  FROM    \`sessions\` s
  JOIN    \`users\` u       ON  s.user = u.id
  WHERE   s.expiry > NOW()  AND s.id = ?
  LIMIT   1;
`

const update_user_profile_by_session_query = `
  UPDATE  \`users\` u
    JOIN  \`sessions\` s ON s.user = u.id
    AND   s.id = ? AND s.expiry > NOW()
    SET   u.username = ?, u.display_name = ?;
`

const update_user_password_by_session_query = `
  UPDATE  \`users\` u
    JOIN  \`sessions\` s
    ON    s.user = u.id
    AND   s.id = ?
    AND   s.expiry > NOW()
    SET   u.password_hash = ?;
`

const get_user_basic_info_query = `
  SELECT  u.id AS id,
          u.username AS username,
          u.display_name AS displayName,
          u.balance AS balance,
          u.user_type AS userType
  FROM    users u
  WHERE   u.username = ?
  LIMIT   1;
`

const get_user_items_query = `
  SELECT  i.name AS name,
          g.name AS gameName,
          ui.obtained_on AS obtainedOn
  FROM    users u
  JOIN    inventory_items ui
      ON  u.id = ui.user
  JOIN    items i
      ON  i.id = ui.item
  JOIN    games g
      ON  g.id = i.game
  WHERE   u.username = ?
  ORDER BY gameName, name
  LIMIT   1;
`

const get_user_listings_query = `
  SELECT  i.id AS id,
          i.name AS name,
          g.name AS gameName,
          l.price AS price,
          l.list_date AS date
  FROM    users u
  JOIN    listings l
      ON  l.seller = u.id
  JOIN    items i
      ON  l.item = i.id
  JOIN    games g
      ON  g.id = i.game
  WHERE   u.username = ?
  ORDER BY date DESC
  LIMIT   1;
`

export default class UserModel extends Model {
  static #instance: UserModel

  public static get instance(): UserModel {
    if (!UserModel.#instance) {
      UserModel.#instance = new UserModel()
    }

    return UserModel.#instance
  }


  private constructor() {
    super()

    super
      .register('create', create_user_query, user => [user.username, user.displayName, user.userType, user.passwordHash])
    super
      .register('get-by-username', get_user_by_username_query, user => [user.username])
    super
      .register('get-by-session', get_user_by_session_query, user => [user.sessionId])
    super
      .register('update-profile-by-session', update_user_profile_by_session_query, user => [user.sessionId, user.username, user.displayName])
    super
      .register('update-password-by-session', update_user_password_by_session_query, user => [user.sessionId, user.passwordHash])
    super
      .register('get-basic-info', get_user_basic_info_query, user => [user.username])
    super
      .register('get-listings', get_user_listings_query, user => [user.username])
    super
      .register('get-items', get_user_items_query, user => [user.username])
  }

  public async createUser(user: create_user_spec) {
    await super.execute('create', user)
  }

  public async getUserByUsername(username: string): Promise<IUser | null> {
    const results = await super.execute<RowDataPacket[]>("get-by-username", { username })
    if (results.length < 1)
      return null

    if (!results[0].id || !results[0].username || !results[0].displayName || !results[0].balance || !results[0].userType || !results[0].passwordHash) {
      log.error("Invalid user: ", JSON.stringify(results[0]))
      return null
    }
    return results[0] as IUser
  }

  public async getUserBySession(sessionId: string): Promise<IUser | null> {
    const results = await super.execute<RowDataPacket[]>('get-by-session', { sessionId })
    if (results.length < 1)
      return null

    if (!results[0].id || !results[0].username || !results[0].displayName || !results[0].balance || !results[0].userType || !results[0].passwordHash) {
      log.error("Invalid user: ", JSON.stringify(results[0]))
      return null
    }
    return results[0] as IUser
  }

  public async updateProfileBySession(changes: update_user_profile_by_session_spec) {
    if (changes.username == "") throw new Error("Username cannot be empty")
    if (changes.displayName == "") changes.displayName = changes.username;
    await super.execute('update-profile-by-session', changes)
  }

  public async updatePasswordBySession(session: string, password: string) {
    if (password == "") throw new Error("Password cannot be empty")
    const password_hash = await argon2.hash(password)
    await super.execute('update-password-by-session', { sessionId: session, passwordHash: password_hash })
  }

  public async getUserProfile(username: string): Promise<IUserProfile | null> {
    const basicInfo = await super.execute<RowDataPacket[]>('get-basic-info', { username }) as Omit<IUserProfile, 'passwordHash'>[]
    if (basicInfo.length == 0) return null

    const items = await super.execute<RowDataPacket[]>('get-items', { username }) as IUserProfileInventoryItem[]

    const listings = await super.execute<RowDataPacket[]>('get-listings', { username }) as IUserProfileListing[]

    return {
      ...basicInfo[0],
      inventory: items,
      listings
    }
  }
}




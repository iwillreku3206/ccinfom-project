import argon2 from 'argon2'
import { Model } from "./model"

interface IUser {
  id: number,
  username: string,
  displayName: string,
  balance: number,
  userType: 'basic' | 'admin'
  passwordHash: string
};

// The model to use
export const User = Model<IUser>();

// Specs
type create_user_spec                       = Omit<IUser, 'id' | 'balance'>
type get_user_by_username_spec              = Pick<IUser, 'username'>
type get_user_by_session_spec               = { sessionId: string } 
type update_user_profile_by_session_spec    = Pick<IUser, 'username' | 'displayName'> & { sessionId: string } 
type update_user_password_by_session_spec   = Pick<IUser, 'passwordHash'> & {  sessionId: string } 

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

User
  .register('create',                       create_user_query,                      (user: create_user_spec) => [ user.username, user.displayName, user.userType, user.passwordHash ])
  .register('get-by-username',              get_user_by_username_query,             (user: get_user_by_username_spec) => [ user.username ])
  .register('get-by-session',               get_user_by_session_query,              (user: get_user_by_session_spec) => [ user.sessionId ])
  .register('update-profile-by-session',    update_user_profile_by_session_query,   (user: update_user_profile_by_session_spec) => [ user.sessionId, user.username, user.displayName ])
  .register('update-password-by-session',   update_user_password_by_session_query,  (user: update_user_password_by_session_spec) => [ user.sessionId, user.passwordHash ])

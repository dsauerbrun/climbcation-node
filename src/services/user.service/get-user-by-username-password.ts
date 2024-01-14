import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { SessionUser } from "./types.js"
import bcrypt from 'bcrypt'

export interface GetUserByUsernamePasswordResponse extends ServiceResponseError {
  user: SessionUser
}

export interface GetUserByUsernamePasswordRequest {
  username: string
  password: string
}

export const getUserByUsernamePassword = async ({username, password}: GetUserByUsernamePasswordRequest): Promise<GetUserByUsernamePasswordResponse> => {
  try {
    const dbUsersQuery = await db.selectFrom('users')
      .selectAll('users')
      .where(({ eb, or }) => or([
        eb('username', '=', username),
        eb('email', '=', username)
      ]))
      .where('deleted', 'is', false)
      .execute()

    const failedAttemptText = 'User not found or password is invalid'

    if (dbUsersQuery?.length !== 1) {
      return { error: failedAttemptText, user: null }
    }

    const passwordCompare = await bcrypt.compare(password, dbUsersQuery[0].password)
    if (!passwordCompare) {
      return { error: failedAttemptText, user: null }
    }


    const user: SessionUser = {
      id: dbUsersQuery[0].id,
      userId: dbUsersQuery[0].id,
      username: dbUsersQuery[0].username,
      email: dbUsersQuery[0].email,
      verified: dbUsersQuery[0].verified,
      lastIpLogin: dbUsersQuery[0].lastIpLogin,
    }

    return { user }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching user by username password', err)
    return { error: error.message, user: null }
  }

}

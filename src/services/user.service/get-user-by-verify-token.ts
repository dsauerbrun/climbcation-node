import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { SessionUser } from "./types.js"
import bcrypt from 'bcrypt'

export interface GetUserByVerifyTokenResponse extends ServiceResponseError {
  user: SessionUser
}

export interface GetUserByVerifyTokenRequest {
  token: string
}

export const getUserByVerifyToken = async ({token}: GetUserByVerifyTokenRequest): Promise<GetUserByVerifyTokenResponse> => {
  try {
    const dbUsersQuery = await db.selectFrom('users')
      .selectAll('users')
      .where('verifyToken', '=', token)
      .execute()

    if (dbUsersQuery?.length !== 1) {
      return { error: 'Invalid verification token', user: null }
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
    console.error('Error fetching user by verification token', err)
    return { error: error.message, user: null }
  }

}

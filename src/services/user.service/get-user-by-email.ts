import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { SessionUser } from "./types.js";

export interface GetUserByEmailResponse extends ServiceResponseError {
  user?: SessionUser
}

export interface GetUserByEmailRequest {
  email: string
}

export const getUserByEmail = async ({email}: GetUserByEmailRequest): Promise<GetUserByEmailResponse> => {
  try {
    const dbUsersQuery = await db.selectFrom('users')
      .selectAll('users')
      .where('email', '=', email)
      .execute()

    if (dbUsersQuery?.length === 0) {
      return {}
    }
    const user: SessionUser = {
      id: dbUsersQuery[0].id,
      userId: dbUsersQuery[0].id,
      username: dbUsersQuery[0].username,
      email: dbUsersQuery[0].email,
      verified: dbUsersQuery[0].verified,
      lastIpLogin: dbUsersQuery[0].lastIpLogin,
      deleted: dbUsersQuery[0].deleted,
    };

    return { user }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching user by email', err)
    return { error: error.message, user: null }
  }

}

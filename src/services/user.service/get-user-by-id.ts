import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { SessionUser } from "./types.js";

export interface GetUserByIdResponse extends ServiceResponseError {
  user?: SessionUser
}

export interface GetUserByIdRequest {
  id: string
}

export const getUserById = async ({id}: GetUserByIdRequest): Promise<GetUserByIdResponse> => {
  try {
    const dbUsersQuery = await db.selectFrom('users')
      .selectAll('users')
      .where('id', '=', id)
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
    console.error('Error fetching user by id', err)
    return { error: error.message, user: null }
  }

}

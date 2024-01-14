import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"

export interface UpdateUsernameResponse extends ServiceResponseError {
}

export interface UpdateUsernameRequest {
  userId: string
  newUsername: string
}

export const updateUsername = async ({userId, newUsername}: UpdateUsernameRequest): Promise<UpdateUsernameResponse> => {
  try {
    await db
      .updateTable('users')
      .set({'username': newUsername})
      .where('id', '=', userId)
      .executeTakeFirst()

    return { }
  } catch (err) {
    const error = err as Error
    console.error('Error updating username', err)
    if (error.message.includes('duplicate key value violates unique constraint')) {
      return { error: 'Username already exists' }
    }
    return { error: error.message }
  }

}

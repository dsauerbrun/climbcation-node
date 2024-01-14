import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { SessionUser } from "./types.js"
import bcrypt from 'bcrypt'

export interface UpdateUserLastIpResponse extends ServiceResponseError {
}

export interface UpdateUserLastIpRequest {
  userId: string
  ip: string
}

export const updateUserLastIp = async ({userId, ip}: UpdateUserLastIpRequest): Promise<UpdateUserLastIpResponse> => {
  try {
    await db
      .updateTable('users')
      .set({'lastIpLogin': ip})
      .where('id', '=', userId)
      .executeTakeFirst()

    return { }
  } catch (err) {
    const error = err as Error
    console.error('Error updating user ip address', err)
    return { error: error.message }
  }

}

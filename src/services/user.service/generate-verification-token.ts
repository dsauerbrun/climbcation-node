import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import crypto from 'crypto'

export interface GenerateVerificationTokenResponse extends ServiceResponseError {
  token?: string
}

export interface GenerateVerificationTokenRequest {
  userId: string
}

export const generateVerificationToken = async ({userId}: GenerateVerificationTokenRequest): Promise<GenerateVerificationTokenResponse> => {
  try {
    const token = crypto.randomBytes(48).toString('hex')
    await db
      .updateTable('users')
      .set({'verifyToken': token})
      .where('id', '=', userId)
      .executeTakeFirst()

    return { token }
  } catch (err) {
    const error = err as Error
    console.error('Error updating verification token', err)
    return { error: error.message }
  }

}

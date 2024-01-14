import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import bcrypt from 'bcrypt'
import { generateVerificationToken } from "./generate-verification-token.js";
import { getPasswordDetails } from "./utils.js";

export interface CreateUserResponse extends ServiceResponseError {
  userId?: string;
}

export interface CreateUserRequest {
  email: string,
  username: string,
  password: string,
}

export const createUser = async ({email, username, password}: CreateUserRequest): Promise<CreateUserResponse> => {
  try {

    const { error, salt, saltedPassword } = getPasswordDetails(password)
    if (error) {
      return { error }
    }

    const newUser = await db
      .insertInto('users')
      .values({
        provider: 'self',
        email,
        username,
        password: saltedPassword,
        passwordSalt: salt,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()
    
    await generateVerificationToken({ userId: newUser.id })

    return { userId: newUser.id }
  } catch (err) {
    const error = err as Error
    console.error('Error creating user', err)
    return { error: error.message }
  }

}

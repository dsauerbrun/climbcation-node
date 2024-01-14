import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { generateVerificationToken } from "./generate-verification-token.js"
import { sendUserEmail } from "./send-user-email.js"
import { generateVerificationEmailText } from "./utils.js"

export interface ReactivateUserResponse extends ServiceResponseError {
}

export interface ReactivateUserRequest {
  userId: string
}

export const sendReactivateUserEmail = async ({userId}: ReactivateUserRequest): Promise<ReactivateUserResponse> => {
  try {
    const { token } = await generateVerificationToken({ userId })

    const user = await db.selectFrom('users')
      .selectAll('users')
      .where('id', '=', userId)
      .executeTakeFirstOrThrow()
    
    const { textMessage, emailMessage } = generateVerificationEmailText(user.username, token)
    await sendUserEmail({ email: user.email, text: textMessage, html: emailMessage, from: 'no-reply@climbcation.com', subject: 'Please verify your email' })

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

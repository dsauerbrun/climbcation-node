import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import nodemailer from 'nodemailer'
import { generateVerificationEmailText } from "./utils.js";
import { sendUserEmail } from "./send-user-email.js";

export interface SendVerificationEmailResponse extends ServiceResponseError {
}

export interface SendVerificationEmailRequest {
  email: string,
  userId: string
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  post: 587,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
} as nodemailer.TransportOptions);

export const sendVerificationEmail = async ({email, userId}: SendVerificationEmailRequest): Promise<SendVerificationEmailResponse> => {
  try {
    const user = await db.selectFrom('users')
      .selectAll('users')
      .where('id', '=', userId)
      .executeTakeFirst()

    const {textMessage, emailMessage} = generateVerificationEmailText(user.username, user.verifyToken)
    await sendUserEmail({email, text: textMessage, html: emailMessage, from: 'no-reply@climbcation.com', subject: 'Please verify your email'})
    return { }
  } catch (err) {
    const error = err as Error
    console.error('Error creating user', err)
    return { error: error.message }
  }

}

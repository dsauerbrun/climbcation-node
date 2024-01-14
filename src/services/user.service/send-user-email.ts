import db from "../../db/index.js";
import { ServiceResponseError } from "../../lib/index.js";
import nodemailer from "nodemailer";
import { generateVerificationEmailText } from "./utils.js";

export interface SendUserEmailResponse extends ServiceResponseError {}

export interface SendUserEmailRequest {
  email: string;
  subject: string;
  from: string;
  text: string;
  html: string;
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

export const sendUserEmail = async ({
  email,
  subject,
  from,
  text,
  html,
}: SendUserEmailRequest): Promise<SendUserEmailResponse> => {
  try {
    const info = await transporter.sendMail({
      from,
      to: email,
      subject,
      text,
      html,
    });

    return {};
  } catch (err) {
    const error = err as Error;
    console.error("Error sending email", err);
    return { error: error.message };
  }
};

import bcrypt from 'bcrypt';

export const generateVerificationEmailText = (username: string, token: string) => {

  const confirmEmailUserUrl = `https://www.climbcation.com/verify?id=${token}`
  const textMessage = `Hello ${username}, thanks for registering on Climbcation! To confirm your registration please click ${confirmEmailUserUrl}`;
  const emailMessage = `
    From: Climbcation <no-reply@climbcation.com>
    To: #{self.username} <#{self.email}>
    MIME-Version: 1.0
    Content-type: text/html
    Subject: Please verify your email 

    ${textMessage}

    `;

    return { textMessage, emailMessage }
}

export const getPasswordDetails = (password: string) => {
  if (password.length < 6) {
      return { error: 'Password must be at least 6 characters' }
    }

  const salt = bcrypt.genSaltSync(10);
  const saltedPassword = bcrypt.hashSync(password, salt);
  return { saltedPassword, salt}
}
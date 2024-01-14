export const generateVerificationEmailText = (username: string, token: string) => {

  const confirmEmailUserUrl = `https://www.climbcation.com/verify?id=${token}`
  const textMessage = `Hello ${username}, thanks for registering on Climbcation! To confirm your registration please click ${confirmEmailUserUrl}`;
  const emailMessage = `
    <<MESSAGE_END
    From: Climbcation <no-reply@climbcation.com>
    To: #{self.username} <#{self.email}>
    MIME-Version: 1.0
    Content-type: text/html
    Subject: Please verify your email 

    ${textMessage}

    MESSAGE_END
    `;

    return { textMessage, emailMessage }
}
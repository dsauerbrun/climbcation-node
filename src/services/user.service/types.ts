import { DateTime } from "luxon";

declare global {
  namespace Express {
    interface User extends SessionUser {
    }
  }
}
export interface SessionUser {
  username: string
  email: string
  sessionId?: string
  id: string
  verified: boolean
  lastIpLogin: string
  userId: string
  deleted?: boolean
}

export const DESTINATION_CATEGORY_NAME = 'Destinations' 
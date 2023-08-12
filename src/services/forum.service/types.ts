import { DateTime } from "luxon";

export interface Post {
  content: string
  createdAt: DateTime
  deleted: boolean
  forumThreadId: number
  id: number
  updatedAt: DateTime
  userId: number
  username: string
}

export const DESTINATION_CATEGORY_NAME = 'Destinations' 
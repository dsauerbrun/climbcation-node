import { DateTime } from "luxon"
import db from "../../db/index.js"
import { ServiceResponseError } from "../../lib/index.js"
import { DESTINATION_CATEGORY_NAME, Post } from "./types.js"
import { sql } from "kysely"

export interface GetThreadResponse extends ServiceResponseError {
  posts?: Post[]
}

export interface GetThreadRequest {
  threadId?: number
  destinationSlug?: string
}

export const getThread = async ({threadId, destinationSlug}: GetThreadRequest): Promise<GetThreadResponse> => {
  try {
    let dbPostsQuery = db.selectFrom('posts')
      .innerJoin('users', 'users.id', 'posts.userId')
      .innerJoin('forumThreads', 'forumThreads.id', 'posts.forumThreadId')
      .selectAll('posts')
      .select([
        sql`CASE WHEN users.deleted THEN '[DELETED]' ELSE users.username END`.as('username'),
      ])
      .orderBy('posts.createdAt', 'asc')

    if (destinationSlug) {
      const destinationCategory = await db.selectFrom('categories').selectAll('categories').where('name', '=', DESTINATION_CATEGORY_NAME).executeTakeFirstOrThrow()
      dbPostsQuery = dbPostsQuery.where('forumThreads.categoryId', '=', destinationCategory.id)
        .where('forumThreads.subject', '=', destinationSlug)
    } else if (threadId) {
      dbPostsQuery = dbPostsQuery.where('posts.forumThreadId', '=', String(threadId))
    }

    const dbPosts = await dbPostsQuery.execute()
    

    const posts = dbPosts.map(post => {
      const { id, userId, forumThreadId, content, createdAt, username, deleted, updatedAt } = post
      return {
        id: Number(id),
        userId: Number(userId),
        forumThreadId: Number(forumThreadId),
        content,
        createdAt: DateTime.fromJSDate(createdAt),
        username: String(username),
        deleted,
        updatedAt: DateTime.fromJSDate(updatedAt),
      }
    })


    return { posts }
  } catch (err) {
    const error = err as Error
    console.error('Error fetching locations', err)
    return { error: error.message }
  }

}

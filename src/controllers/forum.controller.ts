import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestQuery, TypedResponse } from "../lib/models.js"
import { GetThreadResponse, getThread } from "../services/forum.service/index.js"

const forumRoutes: ControllerEndpoint[] = [
  {
    routePath: '/threads/:id',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestQuery<{destinationSlug?: string}>, res: TypedResponse<GetThreadResponse>) => {

      let destinationSlug = null
      const threadId = Number(req.params.id)
      if (isNaN(threadId)) {
        destinationSlug = req.params.id
      }

      const thread = await getThread({ threadId, destinationSlug })
      if (thread?.error) {
        res.status(400).send(thread.error)
        return
      }

      res.json(thread)
    }
  },
]

export default forumRoutes
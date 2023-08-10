import { Request, Response } from 'express'
import NodeCache from 'node-cache'

const CACHE_TTL_SECONDS = 1
const MAX_REQUESTS_PER_TTL = 10
const rateCache = new NodeCache({ stdTTL: CACHE_TTL_SECONDS})

const rateLimiter = (req: Request, res: Response, next: any) => {
    const { userId: queryUserId } = req.query
    const { userId: paramUserId } = req.params
    const { userId: bodyUserId } = req.body
    const userId = queryUserId || paramUserId || bodyUserId || 'UNIVERSAL'

    const numRequestsInLastSecond = Number(rateCache.get(userId))
    if (numRequestsInLastSecond > MAX_REQUESTS_PER_TTL) {
      const reason = 'Rate Limit Exceeded'
      const explanation = `You can only make ${MAX_REQUESTS_PER_TTL} requests per ${CACHE_TTL_SECONDS} seconds`

      res.status(429)
      res.json({reason, explanation})
      return 
    }

    // This is a crude implementation of rate limiting which will not work in a distributed system since the request storage is an inMemory cache.
    // We can also handle this at the service layer
    rateCache.set(userId, numRequestsInLastSecond ? Number(numRequestsInLastSecond) + 1 : 1)

    next()
  }

export default rateLimiter

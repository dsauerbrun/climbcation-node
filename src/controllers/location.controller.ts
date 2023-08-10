import { Request, Response } from "express"
import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint } from "../lib/models.js"
import { getLocation } from '../services/location.service/index.js'

const locationRoutes: ControllerEndpoint[] = [
  {
    routePath: '/location/:locationSlug',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: Request, res: Response) => {
      const { locationSlug } = req.params

      const { location, error } = await getLocation({ locationSlug })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ location })
    }
  }
]

export default locationRoutes
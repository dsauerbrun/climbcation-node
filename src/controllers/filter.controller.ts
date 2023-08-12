import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedResponse } from "../lib/models.js"
import { getLocations } from '../services/filter.service/index.js'
import { LocationRequest } from "../services/filter.service/get-locations.js"
import { FilterLocation } from "../services/filter.service/types.js"
import { Request } from "express"

const filterRoutes: ControllerEndpoint[] = [
  {
    routePath: '/filter/locations',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: Request, res: TypedResponse<{locations: FilterLocation[], cursor: string}>) => {
      const { filter, mapFilter, cursor, sort } = req.query as unknown as LocationRequest

      const { locations, cursor: newCursor, error } = await getLocations({ filter, mapFilter, cursor, sort })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ locations, cursor: newCursor })
    }
  }
]

export default filterRoutes
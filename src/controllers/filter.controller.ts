import { queryParamJson, rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedResponse } from "../lib/models.js"
import { GetFiltersResponse, getFilters, getLocations } from '../services/filter.service/index.js'
import { LocationRequest } from "../services/filter.service/get-locations.js"
import { FilterLocation, MapLocation } from "../services/filter.service/types.js"
import { Request } from "express"

const filterRoutes: ControllerEndpoint[] = [
  {
    routePath: '/api/filter/locations',
    method: 'get',
    middlewares: [rateLimiter, queryParamJson],
    executionFunction: async (req: Request, res: TypedResponse<{locations: FilterLocation[], mapLocations: MapLocation[], cursor: string}>) => {
      const { filter, mapFilter, cursor, sort } = req.query as unknown as LocationRequest

      const { locations, mapLocations, cursor: newCursor, error } = await getLocations({ filter, mapFilter, cursor, sort })
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ locations, cursor: newCursor, mapLocations })
    }
  },
  {
    routePath: '/api/filters/all',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (_req: Request, res: TypedResponse<GetFiltersResponse>) => {
      const { climbingTypes, grades, error } = await getFilters()
      if (error) {
        res.status(400).send(error)
        return
      }

      res.json({ climbingTypes, grades })
    }
  }
]

export default filterRoutes
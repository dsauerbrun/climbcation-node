import { rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedResponse } from "../lib/models.js"
import { Request } from "express"
import { GetAttributeOptionsResponse, getAttributeOptions } from "../services/crud.service/index.js"

const crudRoutes: ControllerEndpoint[] = [
  {
    routePath: '/get_attribute_options',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: Request, res: TypedResponse<GetAttributeOptionsResponse>) => {

      const attributeOptions = await getAttributeOptions()
      if (attributeOptions?.error) {
        res.status(400).send(attributeOptions.error)
        return
      }

      res.json(attributeOptions)
    }
  },
]

export default crudRoutes
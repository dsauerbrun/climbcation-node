import { Request, Response } from 'express'

const queryParamJson = (req: Request, res: Response, next: any) => {
    const query = req.query

    try {
      const queryKeys = Object.keys(query)
      const newQuery = {}
      for (const key of queryKeys) {
        newQuery[key] = JSON.parse(query[key] as string)
      }

      req.query = newQuery

    } catch(e) {

    }

    next()
  }

export default queryParamJson

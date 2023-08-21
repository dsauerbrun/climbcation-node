import { Request, Response } from 'express'

const queryParamJson = (req: Request, res: Response, next: any) => {
    const query = req.query

    try {
      const queryKeys = Object.keys(query)
      const newQuery = {}
      for (const key of queryKeys) {
        if (newQuery[key] !== 'undefined') {
          newQuery[key] = parseJsonOrReturnString(query[key] as string)
        }
      }

      req.query = newQuery
    } catch(e) {
      console.error('error parsing query', e)
      console.error(query)
    }

    next()
  }

const parseJsonOrReturnString = (str: string) => {
    try {
        return JSON.parse(str);
    } catch (e) {
        return str;
    }
}
export default queryParamJson

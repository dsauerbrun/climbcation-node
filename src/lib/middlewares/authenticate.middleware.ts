import { Request, Response } from 'express'

const authenticate = (req: Request, res: Response, next: any) => {
    // some auth logic here
    const { userId: queryUserId } = req.query
    const { userId: paramUserId } = req.params
    const { userId: bodyUserId } = req.body
    const userId = queryUserId || paramUserId || bodyUserId
    if (!userId) {
      const reason = 'No user provided'
      const explanation = 'Must provide a user to complete this request.'

      res.status(403)
      res.json({reason, explanation})
      return 
    }

    next()

  }

export default authenticate

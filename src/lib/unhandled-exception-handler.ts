import { Request, Response } from 'express'

const unhandledExceptionHandler = (error:Error, req:Request, res:Response, next:any) => {
  if (!error) {
    next()
  }

  // Do we want to deal with PII masking here on our logs?
  console.error(`There was an unhandled exception for endpoint ${req.route.path}`, error)

  const reason = 'There was a problem processing your request.'
  const explanation = 'An unexpected error occured while processing your request. Please try again and if the problem persists, please contact us.'

  res.status(500)
  res.json({reason, explanation})
}

export {
  unhandledExceptionHandler
}

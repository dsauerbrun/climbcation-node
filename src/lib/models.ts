import { ErrorRequestHandler, Request, Response } from "express"
import { Query, Send } from 'express-serve-static-core';


export interface ControllerEndpoint {
  routePath: string
  method: string
  middlewares: ((req: Request, res: Response, next: any) => void)[]
  executionFunction: (req: Request, res: Response, next: any) => void
  errorFunction?: (err: ErrorRequestHandler, req: Request, res: Response, next: any) => void
}

export interface ServiceResponseError {
  error?: string
}

export interface TypedRequestBody<T> extends Request {
  body: T
}

export interface TypedRequestQuery<T extends Query> extends Request {
  query: T
}

export interface TypedResponse<ResBody> extends Response {
  json: Send<ResBody, this>;
}

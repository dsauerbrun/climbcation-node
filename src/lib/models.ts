import { Request, Response } from "express"

export interface ControllerEndpoint {
  routePath: string
  method: string
  middlewares: ((req: Request, res: Response, next: any) => void)[]
  executionFunction: (req: Request, res: Response, next: any) => void
}
import { Request, Response, ErrorRequestHandler } from "express";
import { DateTime } from "luxon"

import locationRoutes from "../controllers/location.controller.js"
import filterRoutes from "../controllers/filter.controller.js"
import crudRoutes from "../controllers/crud.controller.js"
import forumRoutes from "../controllers/forum.controller.js"
import { ControllerEndpoint } from "../lib/models.js"
import userRoutes from "../controllers/user.controller.js"
import { Application } from "express";

const allRoutes = [
  ...locationRoutes,
  ...filterRoutes,
  ...crudRoutes,
  ...forumRoutes,
  ...userRoutes,
]

export default (app: Application) => {
  // check if there are duplicate routes
  const routeDuplicateChecker = {} 
  for (const route of allRoutes) {
    instantiateRoute(route, app)
    if (routeDuplicateChecker[route.method + '#' +route.routePath]) {
      throw new Error(`Duplicate route found: ${route.method} ${route.routePath}`)
    }
    routeDuplicateChecker[route.method + '#' +route.routePath] = true
  }
}

const instantiateRoute = (route: ControllerEndpoint, app: Application) => {
  if (route.method === 'get') {
    app.get(route.routePath, route.middlewares, routeWrapper(route.executionFunction), errRouteWrapper(route.errorFunction))
  }
  if (route.method === 'post') {
    app.post(route.routePath, route.middlewares, routeWrapper(route.executionFunction), errRouteWrapper(route.errorFunction))
  }
  if (route.method === 'put') {
    app.put(route.routePath, route.middlewares, routeWrapper(route.executionFunction), errRouteWrapper(route.errorFunction))
  }
  if (route.method === 'delete') {
    app.delete(route.routePath, route.middlewares, routeWrapper(route.executionFunction), errRouteWrapper(route.errorFunction))
  }
}

const routeWrapper = (routeFunction) => {
  return (req: Request, res: Response, next: any) => {
    // put any metric tracking data here(eg. datadog)
    const startTime = DateTime.now().valueOf()

    res.on('finish', () => {
      // put any metric tracking data here on request finishing(eg. datadog tracking for how long request took)
      const endTime = DateTime.now().valueOf()
      console.log(`${req.path} took ${endTime - startTime} ms to complete`)
    })

    try {
      routeFunction(req, res, next)
    } catch(err) {
      unhandledErrorHandler(req, res, err)
    }
  }
}

const errRouteWrapper = (routeFunction) => {
  return (err: ErrorRequestHandler, req: Request, res: Response, next: any) => {
    // put any metric tracking data here(eg. datadog)
    const startTime = DateTime.now().valueOf();

    res.on("finish", () => {
      // put any metric tracking data here on request finishing(eg. datadog tracking for how long request took)
      const endTime = DateTime.now().valueOf();
      console.log(`${req.path} took ${endTime - startTime} ms to complete`);
    });

    try {
      routeFunction(err, req, res, next);
    } catch (err) {
      unhandledErrorHandler(req, res, err);
    }
  };
};

const unhandledErrorHandler = (req: Request, res: Response, error) => {
  // handler for fatal errors so server doesnt crash.
  console.error('Unhandled Api Exception - ', error)

  const reason = 'There was a problem processing your request.'
  const explanation = 'An unexpected error occured while processing your request. Please try again and if the problem persists, please contact us.'

  res.status(500).json({ reason, explanation })
}
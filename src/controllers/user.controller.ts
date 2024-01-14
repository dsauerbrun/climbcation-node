import { authenticate, rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestQuery, TypedResponse } from "../lib/models.js"
import passport from 'passport'
import LocalStrategy from 'passport-local'
import { SessionUser } from "../services/user.service/types.js"
import { getUserByUsernamePassword, updateUserLastIp } from "../services/user.service/index.js"

const userRoutes: ControllerEndpoint[] = [
  {
    routePath: '/api/login',
    method: 'post',
    middlewares: [rateLimiter, authenticate],
    executionFunction: async (req: TypedRequestQuery<{username: string, password: string}>, res: TypedResponse<any>) => {
      await updateUserLastIp({ userId: req.user.id, ip: req.ip })

      res.json(req.user)
    },
  },
  {
    routePath: '/api/user',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestQuery<{}>, res: TypedResponse<SessionUser>) => {
      if (!req.user) {
        res.status(401).send('Unauthorized')
        return
      }

      res.json(req.user)
    },
  },
  {
    routePath: '/api/user/logout',
    method: 'get',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestQuery<{}>, res: TypedResponse<{}>) => {
      req.logout((err) => {
        if (err) {
          res.status(500).json({ error: err })
        }
        res.redirect(req.baseUrl);
      })
    },
  },
]

passport.use(
  new LocalStrategy(async (username, password, cb) => {
    if (!username || !password) {
      return cb(null, false, { message: 'Missing username/email or password'} )
    }

    const userResp = await getUserByUsernamePassword({ username, password });
    if (userResp?.error) {
      return cb(null, false, { message: userResp.error });
    }


    return cb(null, userResp.user)
  })
);

passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    cb(null, { user_id: user.id, username: user.username, email: user.email, verified: user.verified });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user as SessionUser);
  });
});

export default userRoutes
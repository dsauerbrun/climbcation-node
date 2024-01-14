import { authenticate, rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestQuery, TypedResponse } from "../lib/models.js"
import passport from 'passport'
import LocalStrategy from 'passport-local'
import { SessionUser } from "../services/user.service/types.js"
import { getUserByUsernamePassword, updateUserLastIp } from "../services/user.service/index.js"
import { isAuthenticated } from "../lib/middlewares/authenticate.middleware.js"
import { updateUsername } from "../services/user.service/update-username.js"

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
  {
    routePath: '/api/changeusername',
    method: 'post',
    middlewares: [rateLimiter, isAuthenticated],
    executionFunction: async (req: TypedRequestQuery<{username: string}>, res: TypedResponse<{}>) => {
      const { username } = req.body
      if (!username) {
        res.status(400).send('Missing username')
        return
      }

      console.log('before update', req.user)

      const userResp = await updateUsername({ newUsername: username, userId: req.user.userId })
      if (userResp?.error) {
        res.status(400).send(userResp.error)
        return
      }

      req.user.username = username
      res.json({ })
    },
  }
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
    cb(null, { userId: user.id, username: user.username, email: user.email, verified: user.verified });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user as SessionUser);
  });
});

export default userRoutes
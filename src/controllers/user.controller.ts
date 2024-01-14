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
    cb(null, { id: user.id, username: user.username });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user as SessionUser);
  });
});

export default userRoutes
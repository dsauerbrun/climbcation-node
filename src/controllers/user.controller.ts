import { authenticate, rateLimiter } from "../lib/middlewares/index.js"
import { ControllerEndpoint, TypedRequestQuery, TypedResponse } from "../lib/models.js"
import passport from 'passport'
import LocalStrategy from 'passport-local'
import { SessionUser } from "../services/user.service/types.js"
import { getUserByEmail, getUserByUsernamePassword, updateUserLastIp } from "../services/user.service/index.js"
import { isAuthenticated } from "../lib/middlewares/authenticate.middleware.js"
import { updateUsername } from "../services/user.service/update-username.js"
import { getUserByUsername } from "../services/user.service/get-user-by-username.js"
import { createUser } from "../services/user.service/create-user.js"
import { sendVerificationEmail } from "../services/user.service/send-verification-email.js"
import { sendReactivateUserEmail } from "../services/user.service/send-reactivate-user-email.js"

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

      const userResp = await updateUsername({ newUsername: username, userId: req.user.userId })
      if (userResp?.error) {
        res.status(400).send(userResp.error)
        return
      }

      req.user.username = username
      res.json({ })
    },
  },
  {
    routePath: '/api/signup',
    method: 'post',
    middlewares: [rateLimiter],
    executionFunction: async (req: TypedRequestQuery<{username: string, password: string, email: string}>, res: TypedResponse<{}>) => {
      const { username, password, email } = req.body
      if (!username || !password || !email) {
        res.status(400).send('Missing username, password or email')
        return
      }

      let user: SessionUser | null = null;
      const emailUserResp = await getUserByEmail({ email });
      if (emailUserResp?.user) {
        user = emailUserResp.user;
      } else {
        const usernameUserResp = await getUserByUsername({ username });
        usernameUserResp?.user &&  (user = usernameUserResp.user);
      }

      if (user?.deleted) {
        await sendReactivateUserEmail({ userId: user.userId })
        res
          .status(400)
          .send(
            "This account has been deleted. We have sent you a verification email to re-enable your account."
          );
        return
      } else if (user) {
        res.status(400).send('Username or email already exists')
        return
      } else {
        const createResp = await createUser({ username, password, email })
        if (createResp?.error) {
          res.status(400).send(createResp.error)
          return
        }

        updateUserLastIp({ userId: createResp.userId, ip: req.ip })
        await sendVerificationEmail({ email, userId: createResp.userId })
      }

      res.json({ })
    }
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
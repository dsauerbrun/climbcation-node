import { Request, Response } from 'express'
import passport from 'passport';
import { SessionUser } from '../../services/user.service/types.js';

const authenticate = (req: Request, res: Response, next) => {
  passport.authenticate("local", (err, user: SessionUser, info) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      return res.status(400).json(info);
    }

    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return next();
    });
  })(req, res, next);
};

export default authenticate

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

export const googleAuthenticate = (req: Request, res: Response, next) => {
  passport.authenticate("google", (err, user: SessionUser, info) => {
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

export const isAuthenticated = (req: Request, res: Response, next) => {
  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).send('Unauthorized');
}

export default authenticate

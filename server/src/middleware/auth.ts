import type { RequestHandler } from 'express';
import { unauthenticated } from '../lib/errors.js';
import { verifyAccessToken } from '../modules/auth/token.service.js';
import { UserModel } from '../modules/users/user.model.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      userId: string;
    }
  }
}

/**
 * Requires a valid `Authorization: Bearer <jwt>` header and confirms the
 * account still exists and the token predates no password change.
 * Every route below this middleware reads the caller from `res.locals.userId`
 * and must scope its queries with it.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(unauthenticated());

  const claims = verifyAccessToken(header.slice('Bearer '.length).trim());
  const user = await UserModel.findById(claims.sub).select('+tokenVersion').lean();
  if (!user || (user.tokenVersion ?? 0) !== claims.ver) {
    return next(unauthenticated('Your session is no longer valid. Please sign in again.'));
  }
  res.locals.userId = claims.sub;
  next();
};

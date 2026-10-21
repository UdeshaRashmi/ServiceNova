import type { RequestHandler } from 'express';
import type { AuthService } from '../services/auth.js';
import type { Config } from '../config.js';
import { AppError } from '../utils/errors.js';
import type { PublicUser } from '../types/domain.js';

declare global {
  namespace Express {
    interface Locals {
      actor: PublicUser;
    }
  }
}
export const cookieName = (config: Config) =>
  config.environment === 'production'
    ? '__Host-servicenova_session'
    : 'servicenova_session';
export function authenticate(
  auth: AuthService,
  config: Config,
): RequestHandler {
  return async (req, res, next) => {
    const cookie: unknown = req.cookies?.[cookieName(config)];
    res.locals.actor = await auth.authenticate(
      typeof cookie === 'string' ? cookie : undefined,
    );
    next();
  };
}
export const adminOnly: RequestHandler = (_req, res, next) => {
  if (res.locals.actor.role !== 'ADMIN')
    throw new AppError(403, 'FORBIDDEN', 'Administrator access is required.');
  next();
};

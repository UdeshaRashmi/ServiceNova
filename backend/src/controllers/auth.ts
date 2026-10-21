import type { CookieOptions, RequestHandler } from 'express';
import type { Config } from '../config.js';
import type { AuthService } from '../services/auth.js';
import { cookieName } from '../middleware/auth.js';
import { loginSchema, registerSchema } from '../validators/index.js';
import { AppError } from '../utils/errors.js';

export function authControllers(auth: AuthService, config: Config) {
  const options: CookieOptions = {
    httpOnly: true,
    secure: config.environment === 'production',
    sameSite: 'lax',
    path: '/',
  };
  const register: RequestHandler = async (req, res) => {
    const result = await auth.register(registerSchema.parse(req.body));
    res.cookie(cookieName(config), result.token, {
      ...options,
      maxAge: config.sessionTtlSeconds * 1000,
    });
    res.status(201).json({ data: result.user });
  };
  const login: RequestHandler = async (req, res) => {
    const result = await auth.login(loginSchema.parse(req.body));
    res.cookie(cookieName(config), result.token, {
      ...options,
      maxAge: config.sessionTtlSeconds * 1000,
    });
    res.json({ data: result.user });
  };
  const logout: RequestHandler = async (req, res) => {
    const cookie: unknown = req.cookies?.[cookieName(config)];
    try {
      const user = await auth.authenticate(
        typeof cookie === 'string' ? cookie : undefined,
      );
      await auth.logout(user.id);
    } catch (error) {
      // Logout remains idempotent for absent/expired sessions. Storage failures
      // must still surface: do not claim server-side revocation succeeded.
      if (!(error instanceof AppError && error.status === 401)) throw error;
    }
    res.clearCookie(cookieName(config), options);
    res.status(204).end();
  };
  const me: RequestHandler = (_req, res) => {
    res.json({ data: res.locals.actor });
  };
  return { register, login, logout, me };
}

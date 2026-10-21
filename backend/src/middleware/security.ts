import type { RequestHandler } from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import type { Config } from '../config.js';
import { AppError } from '../utils/errors.js';

export function originProtection(config: Config): RequestHandler {
  const trusted = new Set(config.frontendOrigins);
  return (req, _res, next) => {
    const origin = req.get('Origin');
    if (origin && !trusted.has(origin))
      throw new AppError(
        403,
        'UNTRUSTED_ORIGIN',
        'Request origin is not permitted.',
      );
    if (
      !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
      (!origin || !trusted.has(origin))
    ) {
      throw new AppError(
        403,
        'ORIGIN_REQUIRED',
        'A trusted Origin header is required for changes.',
      );
    }
    next();
  };
}
export function corsPolicy(config: Config) {
  return cors({
    origin: config.frontendOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    maxAge: 600,
  });
}
export function limiter(limit: number) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
      },
    },
  });
}
export const requireJson: RequestHandler = (req, _res, next) => {
  if (
    ['POST', 'PATCH'].includes(req.method) &&
    req.path !== '/auth/logout' &&
    !req.is('application/json')
  )
    throw new AppError(
      415,
      'JSON_REQUIRED',
      'Use Content-Type: application/json.',
    );
  next();
};

import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  _next,
) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Please check the submitted fields.',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }
  if (error instanceof AppError) {
    res
      .status(error.status)
      .json({ error: { code: error.code, message: error.message } });
    return;
  }
  if (error && typeof error === 'object' && 'type' in error) {
    if (error.type === 'entity.parse.failed') {
      res.status(400).json({
        error: {
          code: 'INVALID_JSON',
          message: 'Request body must be valid JSON.',
        },
      });
      return;
    }
    if (error.type === 'entity.too.large') {
      res.status(413).json({
        error: {
          code: 'BODY_TOO_LARGE',
          message: 'Request body is too large.',
        },
      });
      return;
    }
  }
  if (error instanceof URIError) {
    res.status(400).json({
      error: { code: 'INVALID_URL', message: 'Invalid URL encoding.' },
    });
    return;
  }
  // Do not print request bodies, credentials, database errors or stack traces.
  console.error('ServiceNova: unhandled server error.');
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.',
    },
  });
};

import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { AppError, BadRequestError, InternalServerError } from './errors.js';
import { getReasonPhrase } from 'http-status-codes';

const isDev = process.env.NODE_ENV !== 'production';

export function httpErrorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const details = err.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    return send(res, new BadRequestError('Validation error', details));
  }

  if (err instanceof AppError) {
    return send(res, err);
  }

  console.error('Unexpected error:', err);

  return send(res, new InternalServerError('Unexpected error'));
}

function send(res: Response, e: AppError) {
  const body = {
    error: {
      message: e.message,
      statusCode: e.statusCode,
      reason: getReasonPhrase(e.statusCode),
      details: isDev ? e.details : undefined,
    }
  };
  res.status(e.statusCode).json(body);
}

import { ZodError } from 'zod';
import type { Request, Response, NextFunction } from 'express';
import { AppError, BadRequestError, InternalServerError } from './errors.js';

export function httpErrorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    const details = err.issues.map(i => ({
      path: i.path.join('.'),
      message: i.message,
      code: i.code,
    }));
    const bad = new BadRequestError('Validation error', details);
    return send(res, bad);
  }

  if (err instanceof AppError) {
    return send(res, err);
  }

  const unknown = new InternalServerError('Unexpected error');
  return send(res, unknown);
}

function send(res: Response, e: AppError) {
  const body = {
    error: {
      message: e.message,
      statusCode: e.statusCode,
      details: e.details ?? undefined,
    }
  };
  res.status(e.statusCode).json(body);
}

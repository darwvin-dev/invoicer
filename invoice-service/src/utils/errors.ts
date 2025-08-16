export class AppError extends Error {
  statusCode: number;
  isOperational = true;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', details?: unknown) {
    super(400, message, details);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', details?: unknown) {
    super(401, message, details);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', details?: unknown) {
    super(403, message, details);
  }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not Found', details?: unknown) {
    super(404, message, details);
  }
}
export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(409, message, details);
  }
}
export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity', details?: unknown) {
    super(422, message, details);
  }
}
export class InternalServerError extends AppError {
  constructor(message = 'Internal Server Error', details?: unknown) {
    super(500, message, details);
  }
}

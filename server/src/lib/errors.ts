export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);
export const unauthenticated = (message = 'Please sign in to continue.') =>
  new AppError(401, 'UNAUTHENTICATED', message);
export const forbidden = (message = 'You do not have access to this resource.') =>
  new AppError(403, 'FORBIDDEN', message);
// Resources owned by someone else are reported as "not found" so the API
// never confirms that another user's record exists.
export const notFound = (resource = 'Resource') => new AppError(404, 'NOT_FOUND', `${resource} not found.`);
export const conflict = (message: string) => new AppError(409, 'CONFLICT', message);

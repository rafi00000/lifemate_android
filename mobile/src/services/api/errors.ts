import { isAxiosError } from 'axios';
import type { ApiErrorBody } from '@/types/api';

export type ApiErrorKind = 'network' | 'timeout' | 'unauthorized' | 'validation' | 'notFound' | 'conflict' | 'rateLimited' | 'server' | 'unknown';

/** One error type for the whole app, with copy that is safe to show users. */
export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isRetryable() {
    return this.kind === 'network' || this.kind === 'timeout' || this.kind === 'server';
  }
}

const kindForStatus = (status: number): ApiErrorKind => {
  if (status === 401) return 'unauthorized';
  if (status === 400 || status === 413) return 'validation';
  if (status === 404) return 'notFound';
  if (status === 409) return 'conflict';
  if (status === 429) return 'rateLimited';
  if (status >= 500) return 'server';
  return 'unknown';
};

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;
  if (isAxiosError<ApiErrorBody>(err)) {
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
      return new ApiError('timeout', 'The server is taking too long. Please try again.');
    }
    if (!err.response) {
      return new ApiError('network', "Can't reach LifeMate. Check your connection and try again.");
    }
    const { status, data } = err.response;
    const kind = kindForStatus(status);
    const fieldErrors: Record<string, string> = {};
    for (const d of data?.error?.details ?? []) {
      if (d.path && !fieldErrors[d.path]) fieldErrors[d.path] = d.message;
    }
    const fallback = kind === 'server' ? 'Something went wrong on our side. Please try again.' : 'Request failed.';
    return new ApiError(kind, data?.error?.message ?? fallback, status, data?.error?.code, fieldErrors);
  }
  return new ApiError('unknown', 'Something unexpected happened. Please try again.');
}

export const errorMessage = (err: unknown) => toApiError(err).message;

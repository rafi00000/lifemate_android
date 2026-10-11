import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { badRequest } from './errors.js';
import { isValidDate, MONTH_RE, TIME_RE } from './calendar.js';

export const zDate = z.string().refine(isValidDate, 'Must be a valid date in YYYY-MM-DD format');
export const zMonth = z.string().regex(MONTH_RE, 'Must be a month in YYYY-MM format');
export const zTime = z.string().regex(TIME_RE, 'Must be a time in HH:mm format');
export const zObjectId = z.string().refine((v) => Types.ObjectId.isValid(v), 'Invalid id');
/** Money in minor units (poisha). Integers only, so sums never drift. */
export const zMoney = z
  .number()
  .int('Amount must be in poisha (whole number)')
  .positive('Amount must be greater than zero')
  .max(100_000_000_000, 'Amount is too large');
export const zTrimmed = (max: number) => z.string().trim().max(max);

type Source = 'body' | 'query' | 'params';

function formatIssues(error: z.ZodError) {
  return error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
}

/**
 * Validates one part of the request and stores the parsed (coerced,
 * stripped) value on `res.locals[source]`. Handlers read from there so
 * unknown keys never reach the database layer.
 */
export function validate<T extends z.ZodType>(source: Source, schema: T): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const issues = formatIssues(result.error);
      const message = issues[0]?.message ?? 'Invalid request';
      return next(badRequest(message, issues));
    }
    res.locals[source] = result.data;
    next();
  };
}

export const idParams = z.object({ id: zObjectId });

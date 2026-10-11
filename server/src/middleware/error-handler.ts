import type { ErrorRequestHandler, RequestHandler } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../lib/errors.js';
import { env } from '../config/env.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  // Malformed JSON body from express.json()
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is not valid JSON.' } });
    return;
  }
  if (err?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'VALIDATION_ERROR', message: 'Request body is too large.' } });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => ({ path: e.path, message: e.message }));
    res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: details[0]?.message ?? 'Invalid data', details },
    });
    return;
  }
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: `Invalid value for ${err.path}.` } });
    return;
  }
  if (err?.code === 11000) {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'This record already exists.' } });
    return;
  }

  // Unknown failure: log the stack server-side only, never leak it.
  if (env.NODE_ENV !== 'test') {
    console.error('[unhandled]', err instanceof Error ? err.stack : err);
  }
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our side.' } });
};

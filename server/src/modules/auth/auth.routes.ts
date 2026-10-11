import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../../config/env.js';
import { validate } from '../../lib/validation.js';
import * as controller from './auth.controller.js';
import { loginSchema, refreshSchema, registerSchema } from './auth.schema.js';

// Credential endpoints get a tight per-IP budget to slow password guessing.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a few minutes and try again.' } },
});

export const authRouter = Router();

authRouter.post('/register', credentialLimiter, validate('body', registerSchema), controller.register);
authRouter.post('/login', credentialLimiter, validate('body', loginSchema), controller.login);
authRouter.post('/refresh', validate('body', refreshSchema), controller.refresh);
authRouter.post('/logout', validate('body', refreshSchema), controller.logout);

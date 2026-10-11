import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { corsOrigins, env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { billRouter } from './modules/bills/bill.routes.js';
import { budgetRouter } from './modules/budgets/budget.routes.js';
import { dashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { expenseRouter } from './modules/expenses/expense.routes.js';
import { groceryRouter } from './modules/groceries/grocery.routes.js';
import { noteRouter } from './modules/notes/note.routes.js';
import { taskRouter } from './modules/tasks/task.routes.js';
import { userRouter } from './modules/users/user.routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      // Native apps send no Origin; browsers must be on the allow-list.
      origin: (origin, cb) => cb(null, !origin || corsOrigins.includes(origin)),
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const api = express.Router();
  api.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: env.NODE_ENV === 'test' ? 10_000 : 300,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
      message: { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' } },
    }),
  );
  api.use('/auth', authRouter);

  // Everything below requires a signed-in user.
  api.use(requireAuth);
  api.use('/users', userRouter);
  api.use('/dashboard', dashboardRouter);
  api.use('/tasks', taskRouter);
  api.use('/expenses', expenseRouter);
  api.use('/budgets', budgetRouter);
  api.use('/bills', billRouter);
  api.use('/grocery-lists', groceryRouter);
  api.use('/notes', noteRouter);

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

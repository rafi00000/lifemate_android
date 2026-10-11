import { Router, type RequestHandler } from 'express';
import { z } from 'zod';
import { validate, zMoney, zMonth } from '../../lib/validation.js';
import { EXPENSE_CATEGORIES } from '../expenses/categories.js';
import { getBudgetPlan, saveBudgetPlan } from './budget.service.js';

const monthParams = z.object({ month: zMonth });

const saveBudgetSchema = z.object({
  overall: zMoney.nullable(),
  categories: z
    .array(z.object({ category: z.enum(EXPENSE_CATEGORIES), limit: zMoney }))
    .max(EXPENSE_CATEGORIES.length)
    .refine((list) => new Set(list.map((c) => c.category)).size === list.length, 'Each category can only appear once'),
});

const get: RequestHandler = async (_req, res) => {
  res.json({ data: await getBudgetPlan(res.locals.userId, res.locals.params.month) });
};

const save: RequestHandler = async (_req, res) => {
  res.json({ data: await saveBudgetPlan(res.locals.userId, res.locals.params.month, res.locals.body) });
};

export const budgetRouter = Router();
budgetRouter.get('/:month', validate('params', monthParams), get);
budgetRouter.put('/:month', validate('params', monthParams), validate('body', saveBudgetSchema), save);

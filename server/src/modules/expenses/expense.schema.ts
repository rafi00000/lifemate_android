import { z } from 'zod';
import { zDate, zMoney, zMonth } from '../../lib/validation.js';
import { EXPENSE_CATEGORIES } from './categories.js';

export const createExpenseSchema = z.object({
  amount: zMoney,
  category: z.enum(EXPENSE_CATEGORIES),
  note: z.string().trim().max(200, 'Note is too long').default(''),
  date: zDate,
});

export const updateExpenseSchema = createExpenseSchema
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listExpensesQuery = z.object({
  month: zMonth,
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().max(200).optional(),
});

export const summaryQuery = z.object({ month: zMonth });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuery>;

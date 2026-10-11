import { z } from 'zod';
import { zDate, zMoney } from '../../lib/validation.js';
import { EXPENSE_CATEGORIES } from '../expenses/categories.js';
import { BILL_RECURRENCES } from './bill.model.js';

const billFields = {
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  amount: zMoney,
  category: z.enum(EXPENSE_CATEGORIES),
  dueDate: zDate,
  recurrence: z.enum(BILL_RECURRENCES),
  reminderDaysBefore: z.number().int().min(0).max(14),
  notes: z.string().trim().max(500, 'Notes are too long'),
};

export const createBillSchema = z.object({
  ...billFields,
  category: billFields.category.default('bills'),
  recurrence: billFields.recurrence.default('monthly'),
  reminderDaysBefore: billFields.reminderDaysBefore.default(1),
  notes: billFields.notes.default(''),
});

export const updateBillSchema = z
  .object(billFields)
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listBillsQuery = z.object({
  status: z.enum(['unpaid', 'paid', 'all']).default('unpaid'),
});

export const payBillSchema = z.object({
  // The occurrence the client believes it is paying. If it no longer matches
  // (double tap, another device already paid), the server answers 409.
  dueDate: zDate,
  paidOn: zDate,
  logExpense: z.boolean().default(true),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type UpdateBillInput = z.infer<typeof updateBillSchema>;
export type PayBillInput = z.infer<typeof payBillSchema>;

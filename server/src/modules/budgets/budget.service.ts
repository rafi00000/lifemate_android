import { BudgetModel } from './budget.model.js';
import type { ExpenseCategory } from '../expenses/categories.js';

export interface BudgetPlan {
  month: string;
  overall: number | null;
  categories: { category: ExpenseCategory; limit: number }[];
  /** True when the month has no plan of its own and uses an earlier one. */
  inherited: boolean;
  /** Month the plan was defined in, or null when no budget exists at all. */
  sourceMonth: string | null;
}

export async function getBudgetPlan(userId: string, month: string): Promise<BudgetPlan> {
  const doc = await BudgetModel.findOne({ user: userId, month: { $lte: month } })
    .sort({ month: -1 })
    .lean();
  if (!doc) return { month, overall: null, categories: [], inherited: false, sourceMonth: null };
  return {
    month,
    overall: doc.overall ?? null,
    categories: doc.categories.map((c) => ({ category: c.category as ExpenseCategory, limit: c.limit })),
    inherited: doc.month !== month,
    sourceMonth: doc.month,
  };
}

export async function saveBudgetPlan(
  userId: string,
  month: string,
  input: { overall: number | null; categories: { category: ExpenseCategory; limit: number }[] },
): Promise<BudgetPlan> {
  await BudgetModel.findOneAndUpdate(
    { user: userId, month },
    { $set: { overall: input.overall, categories: input.categories } },
    { upsert: true, runValidators: true },
  );
  return getBudgetPlan(userId, month);
}

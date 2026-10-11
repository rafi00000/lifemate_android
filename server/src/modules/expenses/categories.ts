/** Fixed expense categories (custom categories are a future enhancement). */
export const EXPENSE_CATEGORIES = [
  'food',
  'transport',
  'shopping',
  'bills',
  'health',
  'education',
  'entertainment',
  'housing',
  'other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

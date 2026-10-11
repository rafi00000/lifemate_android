import { Types } from 'mongoose';
import { monthOf, monthRange } from '../../lib/calendar.js';
import { notFound } from '../../lib/errors.js';
import { decodeCursor, encodeCursor } from '../../lib/pagination.js';
import { computeBudgetStatus, crossedThreshold, type BudgetAlert, type BudgetStatus } from '../budgets/budget-status.js';
import { getBudgetPlan } from '../budgets/budget.service.js';
import type { ExpenseCategory } from './categories.js';
import { ExpenseModel } from './expense.model.js';
import type { CreateExpenseInput, ListExpensesQuery, UpdateExpenseInput } from './expense.schema.js';

export async function listExpenses(userId: string, q: ListExpensesQuery) {
  const { start, end } = monthRange(q.month);
  const filter: Record<string, unknown> = { user: userId, date: { $gte: start, $lt: end } };
  if (q.category) filter.category = q.category;
  if (q.cursor) {
    const { sortValue, id } = decodeCursor(q.cursor);
    filter.$or = [{ date: { $lt: sortValue, $gte: start } }, { date: sortValue, _id: { $lt: id } }];
    delete filter.date;
  }
  const items = await ExpenseModel.find(filter)
    .sort({ date: -1, _id: -1 })
    .limit(q.limit + 1);
  const hasMore = items.length > q.limit;
  const page = hasMore ? items.slice(0, q.limit) : items;
  const last = page.at(-1);
  return { items: page, nextCursor: hasMore && last ? encodeCursor(last.date, last.id) : null };
}

/** Total spent in a month, overall and per category (one aggregation). */
export async function monthTotals(userId: string, month: string) {
  const { start, end } = monthRange(month);
  const rows = await ExpenseModel.aggregate<{ _id: ExpenseCategory; total: number; count: number }>([
    { $match: { user: new Types.ObjectId(userId), date: { $gte: start, $lt: end } } },
    { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { total: -1 } },
  ]);
  const byCategory = rows.map((r) => ({ category: r._id, total: r.total, count: r.count }));
  const total = byCategory.reduce((sum, r) => sum + r.total, 0);
  return { total, byCategory };
}

export async function monthSummary(userId: string, month: string) {
  const { start, end } = monthRange(month);
  const [totals, daily, plan] = await Promise.all([
    monthTotals(userId, month),
    ExpenseModel.aggregate<{ _id: string; total: number }>([
      { $match: { user: new Types.ObjectId(userId), date: { $gte: start, $lt: end } } },
      { $group: { _id: '$date', total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    getBudgetPlan(userId, month),
  ]);

  const spentBy = new Map(totals.byCategory.map((c) => [c.category, c.total]));
  return {
    month,
    total: totals.total,
    count: totals.byCategory.reduce((n, c) => n + c.count, 0),
    byCategory: totals.byCategory,
    daily: daily.map((d) => ({ date: d._id, total: d.total })),
    budget: {
      plan,
      overall: plan.overall ? computeBudgetStatus(totals.total, plan.overall) : null,
      categories: plan.categories.map((c) => ({
        category: c.category,
        ...computeBudgetStatus(spentBy.get(c.category) ?? 0, c.limit),
      })),
    },
  };
}

/** Budget thresholds this change pushed the month across (see crossedThreshold). */
async function alertsFor(userId: string, month: string, category: ExpenseCategory, delta: number) {
  const [plan, totals] = await Promise.all([getBudgetPlan(userId, month), monthTotals(userId, month)]);
  const alerts: BudgetAlert[] = [];
  const check = (scope: string, spentAfter: number, limit: number) => {
    const state = crossedThreshold(spentAfter - delta, spentAfter, limit);
    if (state) alerts.push({ scope, state, status: computeBudgetStatus(spentAfter, limit) as BudgetStatus });
  };
  if (plan.overall) check('overall', totals.total, plan.overall);
  const catLimit = plan.categories.find((c) => c.category === category);
  if (catLimit) {
    check(category, totals.byCategory.find((c) => c.category === category)?.total ?? 0, catLimit.limit);
  }
  return alerts;
}

export async function createExpense(userId: string, input: CreateExpenseInput) {
  const expense = await ExpenseModel.create({ ...input, user: userId });
  const alerts = await alertsFor(userId, monthOf(input.date), input.category, input.amount);
  return { expense, alerts };
}

export async function updateExpense(userId: string, id: string, input: UpdateExpenseInput) {
  const expense = await ExpenseModel.findOneAndUpdate({ _id: id, user: userId }, { $set: input }, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!expense) throw notFound('Expense');
  return expense;
}

export async function deleteExpense(userId: string, id: string) {
  const result = await ExpenseModel.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0) throw notFound('Expense');
}

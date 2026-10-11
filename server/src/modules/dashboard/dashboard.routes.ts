import { Router, type RequestHandler } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import { addDays, monthOf } from '../../lib/calendar.js';
import { validate, zDate } from '../../lib/validation.js';
import { BillModel } from '../bills/bill.model.js';
import { computeBudgetStatus } from '../budgets/budget-status.js';
import { getBudgetPlan } from '../budgets/budget.service.js';
import { monthTotals } from '../expenses/expense.service.js';
import { GroceryItemModel, GroceryListModel } from '../groceries/grocery.model.js';
import { TaskModel } from '../tasks/task.model.js';

const BILL_HORIZON_DAYS = 14;

// The client sends its local date so "today" matches the user's wall clock.
const dashboardQuery = z.object({ today: zDate });

/**
 * One request returns everything the home screen needs. On a cold free-tier
 * server this is much faster than five separate calls (proposal risk R4).
 */
const getDashboard: RequestHandler = async (_req, res) => {
  const userId: string = res.locals.userId;
  const today: string = res.locals.query.today;
  const uid = new Types.ObjectId(userId);
  const month = monthOf(today);

  const accessibleLists = { $or: [{ owner: uid }, { members: uid }] };

  const [openTasks, doneToday, totals, plan, bills, lists] = await Promise.all([
    TaskModel.find({ user: uid, completed: false, dueDate: { $ne: null, $lte: today } })
      .sort({ dueDate: 1, dueTime: 1 })
      .limit(50),
    TaskModel.countDocuments({ user: uid, completedOn: today }),
    monthTotals(userId, month),
    getBudgetPlan(userId, month),
    BillModel.find({ user: uid, isPaid: false, dueDate: { $lte: addDays(today, BILL_HORIZON_DAYS) } })
      .sort({ dueDate: 1 })
      .limit(10),
    GroceryListModel.find(accessibleLists).select('name').sort({ updatedAt: -1 }).limit(20),
  ]);

  const pendingItems = await GroceryItemModel.find({ list: { $in: lists.map((l) => l._id) }, purchased: false })
    .sort({ createdAt: 1 })
    .limit(200)
    .select('name quantity unit list');
  const pendingByList = new Map<string, number>();
  for (const item of pendingItems) {
    const key = String(item.list);
    pendingByList.set(key, (pendingByList.get(key) ?? 0) + 1);
  }

  const overdue = openTasks.filter((t) => t.dueDate! < today);
  const dueToday = openTasks.filter((t) => t.dueDate === today);

  res.json({
    data: {
      today,
      tasks: {
        overdueCount: overdue.length,
        dueTodayCount: dueToday.length,
        completedTodayCount: doneToday,
        // Overdue first, then today's by time; enough for the home list.
        items: [...overdue, ...dueToday].slice(0, 6),
      },
      spending: {
        month,
        total: totals.total,
        topCategories: totals.byCategory.slice(0, 3),
        overallBudget: plan.overall ? computeBudgetStatus(totals.total, plan.overall) : null,
        categoryWarnings: plan.categories
          .map((c) => ({
            category: c.category,
            ...computeBudgetStatus(totals.byCategory.find((t) => t.category === c.category)?.total ?? 0, c.limit),
          }))
          .filter((c) => c.state !== 'ok'),
      },
      bills: {
        overdueCount: bills.filter((b) => b.dueDate < today).length,
        upcoming: bills.slice(0, 4),
        totalDueSoon: bills.reduce((sum, b) => sum + b.amount, 0),
      },
      groceries: {
        pendingCount: pendingItems.length,
        lists: lists
          .map((l) => ({ id: l.id, name: l.name, pendingItems: pendingByList.get(String(l._id)) ?? 0 }))
          .filter((l) => l.pendingItems > 0)
          .slice(0, 3),
        preview: pendingItems.slice(0, 6),
      },
    },
  });
};

export const dashboardRouter = Router();
dashboardRouter.get('/', validate('query', dashboardQuery), getDashboard);

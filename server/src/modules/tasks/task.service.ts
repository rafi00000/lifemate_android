import { Types } from 'mongoose';
import { advancePast, parseDate } from '../../lib/calendar.js';
import { badRequest, notFound } from '../../lib/errors.js';
import { decodeCursor, encodeCursor } from '../../lib/pagination.js';
import { TaskModel, type TaskDoc } from './task.model.js';
import { scheduleIssues, type CreateTaskInput, type ListTasksQuery, type UpdateTaskInput } from './task.schema.js';

async function findOwned(userId: string, id: string): Promise<TaskDoc> {
  const task = await TaskModel.findOne({ _id: id, user: userId });
  if (!task) throw notFound('Task');
  return task;
}

const anchorFor = (dueDate: string | null, recurrence: string) =>
  dueDate && recurrence === 'monthly' ? parseDate(dueDate).d : null;

export async function listTasks(userId: string, q: ListTasksQuery) {
  if (q.status === 'open') {
    // Open tasks are a bounded working set; sort dated tasks first, then by time.
    const items = await TaskModel.find({ user: userId, completed: false })
      .sort({ dueDate: 1, dueTime: 1, createdAt: 1 })
      .limit(q.limit);
    return { items, nextCursor: null };
  }

  const filter: Record<string, unknown> = { user: new Types.ObjectId(userId) };
  if (q.status === 'completed') filter.completed = true;
  if (q.cursor) {
    const { sortValue, id } = decodeCursor(q.cursor);
    const at = new Date(sortValue);
    filter.$or = [{ updatedAt: { $lt: at } }, { updatedAt: at, _id: { $lt: id } }];
  }
  const items = await TaskModel.find(filter)
    .sort({ updatedAt: -1, _id: -1 })
    .limit(q.limit + 1);
  const hasMore = items.length > q.limit;
  const page = hasMore ? items.slice(0, q.limit) : items;
  const last = page.at(-1);
  return {
    items: page,
    nextCursor: hasMore && last ? encodeCursor(last.updatedAt.toISOString(), last.id) : null,
  };
}

export const getTask = findOwned;

export async function createTask(userId: string, input: CreateTaskInput) {
  return TaskModel.create({ ...input, user: userId, anchorDay: anchorFor(input.dueDate, input.recurrence) });
}

export async function updateTask(userId: string, id: string, input: UpdateTaskInput) {
  const task = await findOwned(userId, id);
  const merged = {
    dueDate: input.dueDate !== undefined ? input.dueDate : (task.dueDate ?? null),
    dueTime: input.dueTime !== undefined ? input.dueTime : (task.dueTime ?? null),
    recurrence: input.recurrence ?? task.recurrence,
    reminderMinutesBefore:
      input.reminderMinutesBefore !== undefined ? input.reminderMinutesBefore : (task.reminderMinutesBefore ?? null),
  };
  const issue = scheduleIssues(merged);
  if (issue) throw badRequest(issue);

  task.set(input);
  if (input.dueDate !== undefined || input.recurrence !== undefined) {
    task.anchorDay = anchorFor(merged.dueDate, merged.recurrence);
  }
  await task.save();
  return task;
}

export async function deleteTask(userId: string, id: string) {
  const result = await TaskModel.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0) throw notFound('Task');
}

/**
 * One-off tasks become completed. Recurring tasks stay open and move to their
 * next occurrence after `today`; the old due date is kept for undo.
 */
export async function completeTask(userId: string, id: string, today: string) {
  const task = await findOwned(userId, id);
  if (task.completed) return task;

  if (task.recurrence !== 'none' && task.dueDate) {
    task.previousDueDate = task.dueDate;
    task.dueDate = advancePast(task.dueDate, task.recurrence, today, task.anchorDay ?? undefined);
  } else {
    task.completed = true;
    task.completedAt = new Date();
  }
  task.completedOn = today;
  await task.save();
  return task;
}

/** Reverses the most recent completion (powers the "Undo" toast). */
export async function reopenTask(userId: string, id: string) {
  const task = await findOwned(userId, id);
  if (task.recurrence !== 'none' && task.previousDueDate) {
    task.dueDate = task.previousDueDate;
    task.previousDueDate = null;
  }
  task.completed = false;
  task.completedAt = null;
  task.completedOn = null;
  await task.save();
  return task;
}

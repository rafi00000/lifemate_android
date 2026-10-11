import { z } from 'zod';
import { zDate, zTime } from '../../lib/validation.js';
import { PRIORITIES, TASK_RECURRENCES } from './task.model.js';

const taskFields = {
  title: z.string().trim().min(1, 'Title is required').max(200, 'Title is too long'),
  notes: z.string().trim().max(2000, 'Notes are too long'),
  priority: z.enum(PRIORITIES),
  dueDate: zDate.nullable(),
  dueTime: zTime.nullable(),
  recurrence: z.enum(TASK_RECURRENCES),
  reminderMinutesBefore: z.number().int().min(0).max(10080).nullable(),
};

interface ScheduleShape {
  dueDate?: string | null;
  dueTime?: string | null;
  recurrence?: string;
  reminderMinutesBefore?: number | null;
}

/** Cross-field rules shared by create and (merged) update. */
export function scheduleIssues(t: ScheduleShape): string | null {
  if (t.dueTime && !t.dueDate) return 'A time needs a due date';
  if (t.recurrence && t.recurrence !== 'none' && !t.dueDate) return 'Repeating tasks need a due date';
  if (t.reminderMinutesBefore != null && !t.dueDate) return 'Reminders need a due date';
  return null;
}

export const createTaskSchema = z
  .object({
    title: taskFields.title,
    notes: taskFields.notes.default(''),
    priority: taskFields.priority.default('medium'),
    dueDate: taskFields.dueDate.default(null),
    dueTime: taskFields.dueTime.default(null),
    recurrence: taskFields.recurrence.default('none'),
    reminderMinutesBefore: taskFields.reminderMinutesBefore.default(null),
  })
  .superRefine((t, ctx) => {
    const issue = scheduleIssues(t);
    if (issue) ctx.addIssue({ code: 'custom', message: issue, path: ['dueDate'] });
  });

export const updateTaskSchema = z
  .object({
    title: taskFields.title,
    notes: taskFields.notes,
    priority: taskFields.priority,
    dueDate: taskFields.dueDate,
    dueTime: taskFields.dueTime,
    recurrence: taskFields.recurrence,
    reminderMinutesBefore: taskFields.reminderMinutesBefore,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update');

export const listTasksQuery = z.object({
  status: z.enum(['open', 'completed', 'all']).default('open'),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  cursor: z.string().max(200).optional(),
});

export const completeTaskSchema = z.object({
  // The user's local "today", used for completedOn and to roll recurring
  // tasks forward past today.
  today: zDate,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuery>;

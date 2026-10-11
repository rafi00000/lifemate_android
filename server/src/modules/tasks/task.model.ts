import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from '../../db/mongoose.js';

export const PRIORITIES = ['low', 'medium', 'high'] as const;
export const TASK_RECURRENCES = ['none', 'daily', 'weekly', 'monthly'] as const;

const taskSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    // Calendar date in the user's local time ("YYYY-MM-DD"), see lib/calendar.ts.
    dueDate: { type: String, default: null },
    // Local wall-clock time ("HH:mm"); null means "any time that day".
    dueTime: { type: String, default: null },
    recurrence: { type: String, enum: TASK_RECURRENCES, default: 'none' },
    // Day of month a monthly series was created on (keeps the 31st sticky).
    anchorDay: { type: Number, min: 1, max: 31, default: null },
    // Minutes before the due time to notify; null = no reminder.
    reminderMinutesBefore: { type: Number, min: 0, max: 10080, default: null },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    // User's local date of the last completion, for "done today" counts.
    completedOn: { type: String, default: null },
    // Due date before the last recurring completion, so it can be undone.
    previousDueDate: { type: String, default: null },
  },
  { timestamps: true },
);

// Open tasks by due date (dashboard, "today" view).
taskSchema.index({ user: 1, completed: 1, dueDate: 1 });
// History, most recently changed first, with a stable tiebreaker for paging.
taskSchema.index({ user: 1, completed: 1, updatedAt: -1, _id: -1 });

export type Task = InferSchemaType<typeof taskSchema>;
export type TaskDoc = HydratedDocument<Task>;
export const TaskModel = model('Task', taskSchema);

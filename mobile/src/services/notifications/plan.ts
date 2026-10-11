import type { Bill, Task } from '@/types/api';
import { addDays, nextOccurrence, toLocalDate } from '@/utils/date';
import { formatMoney } from '@/utils/money';

/**
 * Pure reminder planning: given tasks and bills from the server, decide
 * exactly which local notifications should exist. The device then diffs this
 * plan against what is already scheduled. Because the plan is derived from
 * synced data, a task created on another device gets its reminder here on
 * the next sync, and a completed or deleted task loses it.
 */

export interface PlannedReminder {
  /** Stable id: re-planning the same occurrence yields the same id. */
  id: string;
  at: Date;
  title: string;
  body: string;
  channel: 'tasks' | 'bills';
  route: string;
}

/** Bills remind at a calm morning hour rather than midnight. */
export const BILL_REMINDER_TIME = '09:00';
/** Tasks without a time remind on the morning of their due date. */
export const UNTIMED_TASK_TIME = '09:00';
const HORIZON_DAYS = 35;
const MAX_OCCURRENCES_PER_TASK = 7;
/** Android caps alarms per app (~500); stay far below it. */
export const MAX_SCHEDULED = 60;

function taskOccurrences(task: Task, now: Date): string[] {
  if (!task.dueDate) return [];
  const horizon = addDays(task.dueDate, HORIZON_DAYS);
  const dates = [task.dueDate];
  if (task.recurrence !== 'none') {
    let d = task.dueDate;
    while (dates.length < MAX_OCCURRENCES_PER_TASK) {
      d = nextOccurrence(d, task.recurrence, task.anchorDay);
      if (d > horizon) break;
      dates.push(d);
    }
  }
  // Drop occurrences whose reminder moment has already passed.
  return dates.filter((d) => reminderMoment(task, d).getTime() > now.getTime());
}

function reminderMoment(task: Task, date: string): Date {
  const at = toLocalDate(date, task.dueTime ?? UNTIMED_TASK_TIME);
  return new Date(at.getTime() - (task.dueTime ? (task.reminderMinutesBefore ?? 0) : 0) * 60_000);
}

function describeLead(minutes: number): string {
  if (minutes === 0) return 'Due now';
  if (minutes < 60) return `Due in ${minutes} min`;
  if (minutes % 1440 === 0) return minutes === 1440 ? 'Due tomorrow' : `Due in ${minutes / 1440} days`;
  const h = Math.round(minutes / 60);
  return `Due in ${h} hour${h === 1 ? '' : 's'}`;
}

export function planTaskReminders(tasks: Task[], now: Date): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  for (const task of tasks) {
    if (task.completed || task.reminderMinutesBefore == null || !task.dueDate) continue;
    for (const date of taskOccurrences(task, now)) {
      out.push({
        id: `task:${task.id}:${date}`,
        at: reminderMoment(task, date),
        title: task.title,
        body: task.dueTime ? describeLead(task.reminderMinutesBefore) : 'Due today',
        channel: 'tasks',
        route: '/tasks',
      });
    }
  }
  return out;
}

export function planBillReminders(bills: Bill[], now: Date): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  for (const bill of bills) {
    if (bill.isPaid) continue;
    const amount = formatMoney(bill.amount);
    const moments: { date: string; body: string }[] = [{ date: bill.dueDate, body: `${amount} is due today` }];
    if (bill.reminderDaysBefore > 0) {
      const d = bill.reminderDaysBefore;
      moments.push({
        date: addDays(bill.dueDate, -d),
        body: `${amount} is due ${d === 1 ? 'tomorrow' : `in ${d} days`}`,
      });
    }
    for (const m of moments) {
      const at = toLocalDate(m.date, BILL_REMINDER_TIME);
      if (at.getTime() <= now.getTime()) continue;
      out.push({ id: `bill:${bill.id}:${m.date}`, at, title: bill.name, body: m.body, channel: 'bills', route: '/bills' });
    }
  }
  return out;
}

/** Small stable string hash (djb2) so content edits produce a new id. */
function hash(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/**
 * Soonest first, capped, so the most relevant reminders always fit. The id
 * includes the trigger time and a content hash: moving a task to another time
 * or renaming it yields a new id, so the stale notification is replaced.
 */
export function planReminders(tasks: Task[], bills: Bill[], now = new Date()): PlannedReminder[] {
  return [...planTaskReminders(tasks, now), ...planBillReminders(bills, now)]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED)
    .map((r) => ({ ...r, id: `${r.id}:${r.at.getTime()}:${hash(r.title + r.body)}` }));
}

/** Which scheduled ids to cancel and which planned reminders to add. */
export function diffReminders(scheduledIds: string[], planned: PlannedReminder[]) {
  const plannedIds = new Set(planned.map((p) => p.id));
  const existing = new Set(scheduledIds);
  return {
    cancel: scheduledIds.filter((id) => !plannedIds.has(id)),
    schedule: planned.filter((p) => !existing.has(p.id)),
  };
}

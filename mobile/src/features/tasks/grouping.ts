import type { Priority, Task } from '@/types/api';
import { addDays, diffDays, relativeDayLabel } from '@/utils/date';

export type TaskFilter = 'today' | 'upcoming' | 'all';

export interface TaskSection {
  key: string;
  title: string;
  tone?: 'danger';
  tasks: Task[];
}

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

/** Timed tasks first by time, then by priority, then oldest first. */
export function compareTasks(a: Task, b: Task): number {
  if (a.dueDate !== b.dueDate) {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  if (a.dueTime !== b.dueTime) {
    if (!a.dueTime) return 1;
    if (!b.dueTime) return -1;
    return a.dueTime < b.dueTime ? -1 : 1;
  }
  const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  if (p !== 0) return p;
  return a.createdAt < b.createdAt ? -1 : 1;
}

export function isOverdue(task: Task, today: string): boolean {
  return !task.completed && !!task.dueDate && task.dueDate < today;
}

/**
 * Turns the flat open-task list into the sections shown on screen.
 *  - today:    Overdue, Today
 *  - upcoming: one section per day for the next 14 days, then Later
 *  - all:      Overdue, Today, Tomorrow, This week, Later, Someday
 */
export function groupTasks(tasks: Task[], today: string, filter: TaskFilter): TaskSection[] {
  const sorted = [...tasks].sort(compareTasks);
  const overdue = sorted.filter((t) => isOverdue(t, today));
  const dueToday = sorted.filter((t) => t.dueDate === today);
  const future = sorted.filter((t) => t.dueDate && t.dueDate > today);
  const someday = sorted.filter((t) => !t.dueDate);

  const sections: TaskSection[] = [];
  const push = (key: string, title: string, list: Task[], tone?: 'danger') => {
    if (list.length) sections.push({ key, title, tasks: list, tone });
  };

  if (filter === 'today') {
    push('overdue', 'Overdue', overdue, 'danger');
    push('today', 'Today', dueToday);
    return sections;
  }

  if (filter === 'upcoming') {
    const horizon = addDays(today, 14);
    const byDay = new Map<string, Task[]>();
    for (const t of future) {
      if (t.dueDate! > horizon) continue;
      byDay.set(t.dueDate!, [...(byDay.get(t.dueDate!) ?? []), t]);
    }
    for (const [date, list] of byDay) push(date, relativeDayLabel(date, today), list);
    push('later', 'Later', future.filter((t) => t.dueDate! > horizon));
    return sections;
  }

  const tomorrow = addDays(today, 1);
  push('overdue', 'Overdue', overdue, 'danger');
  push('today', 'Today', dueToday);
  push('tomorrow', 'Tomorrow', future.filter((t) => t.dueDate === tomorrow));
  push('week', 'This week', future.filter((t) => t.dueDate !== tomorrow && diffDays(today, t.dueDate!) < 7));
  push('later', 'Later', future.filter((t) => diffDays(today, t.dueDate!) >= 7));
  push('someday', 'Someday', someday);
  return sections;
}

export function taskCounts(tasks: Task[], today: string) {
  return {
    overdue: tasks.filter((t) => isOverdue(t, today)).length,
    today: tasks.filter((t) => !t.completed && t.dueDate === today).length,
    upcoming: tasks.filter((t) => !t.completed && !!t.dueDate && t.dueDate > today).length,
    all: tasks.filter((t) => !t.completed).length,
  };
}

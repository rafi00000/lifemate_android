/**
 * Local calendar helpers. The API stores due/spend dates as "YYYY-MM-DD"
 * strings in the user's local calendar, and times as "HH:mm". These helpers
 * convert between that format and the device clock; month/day arithmetic is
 * done in UTC so daylight-saving shifts can never move a date.
 */

const pad = (n: number) => String(n).padStart(2, '0');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = WEEKDAYS.map((d) => d.slice(0, 3));

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayString(now = new Date()): string {
  return toDateString(now);
}

export function parseParts(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return { y, m, d };
}

/** Local Date at the given wall-clock time on a calendar date. */
export function toLocalDate(date: string, time = '00:00'): Date {
  const { y, m, d } = parseParts(date);
  const [hh, mm] = time.split(':').map(Number) as [number, number];
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addDays(date: string, days: number): string {
  const { y, m, d } = parseParts(date);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function addMonths(date: string, months: number, anchorDay?: number): string {
  const { y, m, d } = parseParts(date);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${pad(nm)}-${pad(Math.min(anchorDay ?? d, daysInMonth(ny, nm)))}`;
}

/** Mirrors the server's recurrence rule (server/src/lib/calendar.ts). */
export function nextOccurrence(date: string, rule: Recurrence, anchorDay?: number | null): string {
  switch (rule) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addDays(date, 7);
    case 'monthly':
      return addMonths(date, 1, anchorDay ?? undefined);
    case 'yearly':
      return addMonths(date, 12, anchorDay ?? undefined);
    default:
      return date;
  }
}

export function diffDays(from: string, to: string): number {
  const a = parseParts(from);
  const b = parseParts(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

export function weekday(date: string): number {
  const { y, m, d } = parseParts(date);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export const monthKey = (date: string) => date.slice(0, 7);

export function shiftMonth(month: string, delta: number): string {
  return addMonths(`${month}-01`, delta, 1).slice(0, 7);
}

export function formatMonth(month: string, short = false): string {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return `${(short ? MONTHS_SHORT : MONTHS)[m - 1]} ${y}`;
}

/** "Sun, 11 Oct" */
export function formatShortDate(date: string): string {
  const { m, d } = parseParts(date);
  return `${WEEKDAYS_SHORT[weekday(date)]}, ${d} ${MONTHS_SHORT[m - 1]}`;
}

/** "Sunday, 11 October" */
export function formatLongDate(date: string): string {
  const { m, d } = parseParts(date);
  return `${WEEKDAYS[weekday(date)]}, ${d} ${MONTHS[m - 1]}`;
}

/** "11 Oct" or "11 Oct 2027" when not in the current year. */
export function formatDayMonth(date: string, today = todayString()): string {
  const { y, m, d } = parseParts(date);
  const sameYear = y === parseParts(today).y;
  return `${d} ${MONTHS_SHORT[m - 1]}${sameYear ? '' : ` ${y}`}`;
}

/** "Today", "Tomorrow", "Yesterday", weekday within a week, else "11 Oct". */
export function relativeDayLabel(date: string, today = todayString()): string {
  const diff = diffDays(today, date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return WEEKDAYS[weekday(date)]!;
  return formatDayMonth(date, today);
}

/** For bills: "Due today", "Due in 3 days", "2 days overdue". */
export function dueLabel(date: string, today = todayString()): string {
  const diff = diffDays(today, date);
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  if (diff > 1 && diff <= 14) return `Due in ${diff} days`;
  if (diff === -1) return '1 day overdue';
  if (diff < -1) return `${-diff} days overdue`;
  return `Due ${formatDayMonth(date, today)}`;
}

/** "17:00" -> "5:00 PM" */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number) as [number, number];
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m)} ${suffix}`;
}

export function greetingFor(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** 6x7 grid of dates for a month view, starting on Saturday or Sunday. */
export function monthGrid(month: string, weekStartsOn = 0): string[] {
  const first = `${month}-01`;
  const offset = (weekday(first) - weekStartsOn + 7) % 7;
  const start = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export { MONTHS, MONTHS_SHORT, WEEKDAYS, WEEKDAYS_SHORT };

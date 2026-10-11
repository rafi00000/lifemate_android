/**
 * Calendar-date helpers.
 *
 * Due dates and expense dates are stored as plain calendar strings
 * ("YYYY-MM-DD") rather than instants. A bill due on the 15th is due on the
 * 15th wherever the user is, and month boundaries never shift with the
 * server's timezone. All arithmetic below is done in UTC on purpose so the
 * host timezone can never leak into the result.
 */

export const DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
export const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

const pad = (n: number) => String(n).padStart(2, '0');

export function parseDate(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return { y, m, d };
}

export function formatDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** True when the string is a real calendar date (rejects 2026-02-30). */
export function isValidDate(date: string): boolean {
  if (!DATE_RE.test(date)) return false;
  const { y, m, d } = parseDate(date);
  return d <= daysInMonth(y, m);
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function addDays(date: string, days: number): string {
  const { y, m, d } = parseDate(date);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return formatDate(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/**
 * Adds months while keeping the intended day of month. `anchorDay` is the day
 * the series was created on, so Jan 31 -> Feb 28 -> Mar 31 instead of
 * drifting to the 28th forever.
 */
export function addMonths(date: string, months: number, anchorDay?: number): string {
  const { y, m, d } = parseDate(date);
  const total = y * 12 + (m - 1) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const day = Math.min(anchorDay ?? d, daysInMonth(ny, nm));
  return formatDate(ny, nm, day);
}

export function nextOccurrence(date: string, rule: Recurrence, anchorDay?: number): string {
  switch (rule) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addDays(date, 7);
    case 'monthly':
      return addMonths(date, 1, anchorDay);
    case 'yearly':
      return addMonths(date, 12, anchorDay);
    case 'none':
      return date;
  }
}

/**
 * Advances a recurring due date past `after` (exclusive), always moving at
 * least one step. Completing an overdue daily task therefore schedules it for
 * tomorrow rather than for another day in the past.
 */
export function advancePast(date: string, rule: Recurrence, after: string, anchorDay?: number): string {
  if (rule === 'none') return date;
  let next = nextOccurrence(date, rule, anchorDay);
  // Bounded loop: even a daily task ten years overdue needs < 4000 steps.
  for (let i = 0; next <= after && i < 5000; i++) {
    next = nextOccurrence(next, rule, anchorDay);
  }
  return next;
}

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

/** Inclusive first day and exclusive upper bound of a "YYYY-MM" month. */
export function monthRange(month: string): { start: string; end: string } {
  const [y, m] = month.split('-').map(Number) as [number, number];
  const start = formatDate(y, m, 1);
  const end = addMonths(start, 1, 1);
  return { start, end };
}

export function diffDays(from: string, to: string): number {
  const a = parseDate(from);
  const b = parseDate(to);
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000);
}

import type { Expense } from '@/types/api';

export interface DayGroup {
  date: string;
  total: number;
  items: Expense[];
}

/** Groups an already date-sorted (newest first) list by calendar day. */
export function groupByDay(expenses: Expense[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const e of expenses) {
    const last = groups.at(-1);
    if (last && last.date === e.date) {
      last.items.push(e);
      last.total += e.amount;
    } else {
      groups.push({ date: e.date, total: e.amount, items: [e] });
    }
  }
  return groups;
}

import type { Bill } from '@/types/api';
import { diffDays } from '@/utils/date';

export interface BillSection {
  key: 'overdue' | 'week' | 'month' | 'later';
  title: string;
  bills: Bill[];
  tone?: 'danger';
}

/** Buckets unpaid bills by urgency relative to `today`. */
export function sectionBills(bills: Bill[], today: string): BillSection[] {
  const buckets: BillSection[] = [
    { key: 'overdue', title: 'Overdue', bills: [], tone: 'danger' },
    { key: 'week', title: 'Next 7 days', bills: [] },
    { key: 'month', title: 'Later this month', bills: [] },
    { key: 'later', title: 'Later', bills: [] },
  ];
  for (const bill of bills) {
    const d = diffDays(today, bill.dueDate);
    const index = d < 0 ? 0 : d <= 7 ? 1 : d <= 31 ? 2 : 3;
    buckets[index]!.bills.push(bill);
  }
  return buckets.filter((s) => s.bills.length > 0);
}

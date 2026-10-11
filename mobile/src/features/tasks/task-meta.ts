import type { Priority, TaskRecurrence } from '@/types/api';

export const PRIORITY_LABEL: Record<Priority, string> = { low: 'Low', medium: 'Medium', high: 'High' };

export const RECURRENCE_LABEL: Record<TaskRecurrence, string> = {
  none: 'Does not repeat',
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
};

export const REMINDER_OPTIONS: { value: string; label: string; minutes: number | null }[] = [
  { value: 'none', label: 'No reminder', minutes: null },
  { value: '0', label: 'At time', minutes: 0 },
  { value: '10', label: '10 min before', minutes: 10 },
  { value: '30', label: '30 min before', minutes: 30 },
  { value: '60', label: '1 hour before', minutes: 60 },
  { value: '1440', label: '1 day before', minutes: 1440 },
];

export function reminderLabel(minutes: number | null, hasTime: boolean): string {
  if (minutes == null) return 'No reminder';
  if (!hasTime) return 'Morning of the day';
  return REMINDER_OPTIONS.find((o) => o.minutes === minutes)?.label ?? `${minutes} min before`;
}

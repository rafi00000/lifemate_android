import { useEffect } from 'react';
import { useBills } from '@/features/bills/api';
import { useOpenTasks } from '@/features/tasks/api';
import { syncReminders } from '@/services/notifications/reminders';

/**
 * Keeps device reminders in step with synced data. Whenever the open tasks
 * or unpaid bills change (an edit here, a refetch after another device made
 * changes, an app resume), the scheduled notifications are reconciled.
 */
export function useReminderSync() {
  const tasks = useOpenTasks();
  const bills = useBills('unpaid');

  useEffect(() => {
    if (tasks.data && bills.data) void syncReminders(tasks.data, bills.data);
  }, [tasks.data, bills.data]);
}

import { useCallback } from 'react';
import { useToast } from '@/components/feedback/toast';
import { requestPermission } from '@/services/notifications/reminders';
import { usePreferences } from '@/store/preferences';

/**
 * Ask for notification permission at the moment it is clearly useful (the
 * user just turned on a reminder), not on first launch. If it's refused,
 * explain once where to change it; the item is still saved.
 */
export function useEnsureNotificationPermission() {
  const toast = useToast();
  const primed = usePreferences((s) => s.notificationsPrimed);
  const setPrimed = usePreferences((s) => s.setNotificationsPrimed);

  return useCallback(async () => {
    const state = await requestPermission();
    if (state === 'denied' && !primed) {
      setPrimed(true);
      toast.show({
        tone: 'warning',
        message: 'Saved. Notifications are off, so reminders won’t appear. Enable them in Settings.',
        durationMs: 6000,
      });
    }
    return state;
  }, [primed, setPrimed, toast]);
}

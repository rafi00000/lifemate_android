import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { todayString } from '@/utils/date';

/**
 * The local calendar date, kept current: it re-checks when the app returns
 * to the foreground and at the next midnight, so "Today" never goes stale
 * on a phone that was left open overnight.
 */
export function useToday(): string {
  const [today, setToday] = useState(todayString);

  useEffect(() => {
    const check = () => setToday((prev) => (prev === todayString() ? prev : todayString()));
    const sub = AppState.addEventListener('change', (s) => s === 'active' && check());

    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    const timer = setTimeout(check, midnight.getTime() - now.getTime());
    return () => {
      sub.remove();
      clearTimeout(timer);
    };
  }, [today]);

  return today;
}

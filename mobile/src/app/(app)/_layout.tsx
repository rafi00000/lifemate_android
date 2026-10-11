import { router, Stack } from 'expo-router';
import { useEffect } from 'react';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';
import { usePreferences } from '@/store/preferences';
import { useTheme } from '@/theme';

/**
 * Signed-in area: tabs plus pushed screens (editors and details). Editors
 * slide up from the bottom to read as "a task you'll finish and dismiss";
 * details slide in from the side.
 */
export default function AppLayout() {
  const t = useTheme();
  const welcomeTourPending = usePreferences((s) => s.welcomeTourPending);
  useReminderSync();

  // New accounts get the welcome tour once, after the dashboard has appeared.
  useEffect(() => {
    if (!welcomeTourPending) return;
    const timer = setTimeout(() => router.push('/welcome-tour'), 400);
    return () => clearTimeout(timer);
  }, [welcomeTourPending]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="welcome-tour" options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
      <Stack.Screen name="task-editor" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="expense-editor" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="bill-editor" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="budget" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="note-editor" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

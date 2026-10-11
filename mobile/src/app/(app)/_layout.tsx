import { Stack } from 'expo-router';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';
import { useTheme } from '@/theme';

/**
 * Signed-in area: tabs plus pushed screens (editors and details). Editors
 * slide up from the bottom to read as "a task you'll finish and dismiss";
 * details slide in from the side.
 */
export default function AppLayout() {
  const t = useTheme();
  useReminderSync();

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.background }, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="task-editor" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="expense-editor" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="bill-editor" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="budget" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="note-editor" options={{ animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

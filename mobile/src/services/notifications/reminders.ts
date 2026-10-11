import { isRunningInExpoGo } from 'expo';
import type * as NotificationsModule from 'expo-notifications';
import { Platform } from 'react-native';
import type { Bill, Task } from '@/types/api';
import { diffReminders, planReminders } from './plan';

/**
 * Local reminders (proposal: "Local reminders are scheduled on the device, so
 * they do not depend on a server push service").
 *
 * Availability:
 * - Installed app (APK / development build): fully supported.
 * - Expo Go on Android: importing `expo-notifications` throws, because the
 *   package registers a push-token listener on load and Expo Go (SDK 53+)
 *   refuses push APIs. The module is therefore loaded lazily and never in
 *   Expo Go; reminders are simply off there.
 * - Web preview: no notification support.
 */
export type ReminderAvailability = 'available' | 'expo-go' | 'web';

export const reminderAvailability: ReminderAvailability =
  Platform.OS === 'web' ? 'web' : isRunningInExpoGo() ? 'expo-go' : 'available';

const supported = reminderAvailability === 'available';
const OWNED_PREFIXES = ['task:', 'bill:'];

let loaded: typeof NotificationsModule | null = null;
function notifications(): typeof NotificationsModule {
  // Deferred require: the package's import-time side effects must not run in Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  loaded ??= require('expo-notifications') as typeof NotificationsModule;
  return loaded;
}

let configured = false;

export async function configureNotifications(): Promise<void> {
  if (!supported || configured) return;
  configured = true;
  const Notifications = notifications();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    // Android shows no permission prompt until a channel exists.
    await Notifications.setNotificationChannelAsync('tasks', {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
      lightColor: '#4F7A6F',
    });
    await Notifications.setNotificationChannelAsync('bills', {
      name: 'Bill due dates',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#D3A86F',
    });
  }
}

export type PermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export async function getPermissionState(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  const { status } = await notifications().getPermissionsAsync();
  return status as PermissionState;
}

export async function requestPermission(): Promise<PermissionState> {
  if (!supported) return 'unsupported';
  await configureNotifications();
  const Notifications = notifications();
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return 'granted';
  if (!current.canAskAgain) return 'denied';
  const { status } = await Notifications.requestPermissionsAsync();
  return status as PermissionState;
}

let syncing: Promise<void> | null = null;

/**
 * Makes the device's scheduled reminders match the latest synced tasks and
 * bills. Safe to call often; only differences are applied, and concurrent
 * calls are coalesced.
 */
export function syncReminders(tasks: Task[], bills: Bill[]): Promise<void> {
  if (!supported) return Promise.resolve();
  const run = async () => {
    if ((await getPermissionState()) !== 'granted') return;
    await configureNotifications();
    const Notifications = notifications();
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ownedIds = scheduled
      .map((n) => n.identifier)
      .filter((id) => OWNED_PREFIXES.some((p) => id.startsWith(p)));
    const { cancel, schedule } = diffReminders(ownedIds, planReminders(tasks, bills));

    await Promise.all(cancel.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
    for (const r of schedule) {
      await Notifications.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body, data: { route: r.route }, sound: 'default' },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.at, channelId: r.channel },
      });
    }
  };
  syncing = (syncing ?? Promise.resolve()).then(run, run).catch(() => {});
  return syncing;
}

export async function cancelAllReminders(): Promise<void> {
  if (!supported) return;
  await notifications().cancelAllScheduledNotificationsAsync();
}

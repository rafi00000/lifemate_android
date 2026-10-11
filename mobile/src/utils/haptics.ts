import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Subtle tactile feedback; silently skipped where unsupported (web). */
const enabled = Platform.OS === 'android' || Platform.OS === 'ios';

export const haptics = {
  selection: () => {
    if (enabled) Haptics.selectionAsync().catch(() => {});
  },
  light: () => {
    if (enabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  success: () => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  warning: () => {
    if (enabled) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
};

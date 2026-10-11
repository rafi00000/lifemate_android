import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface PreferencesState {
  themeMode: ThemeMode;
  /** Whether we've already explained notifications before asking the OS. */
  notificationsPrimed: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setNotificationsPrimed: (value: boolean) => void;
}

/** Small, non-sensitive UI preferences. Credentials never go here. */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      notificationsPrimed: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      setNotificationsPrimed: (notificationsPrimed) => set({ notificationsPrimed }),
    }),
    { name: 'lifemate.preferences', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

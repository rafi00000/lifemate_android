import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface PreferencesState {
  themeMode: ThemeMode;
  /** Whether we've already explained notifications before asking the OS. */
  notificationsPrimed: boolean;
  /** Set right after sign-up: the welcome tour opens once for new users. */
  welcomeTourPending: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  setNotificationsPrimed: (value: boolean) => void;
  setWelcomeTourPending: (value: boolean) => void;
}

/** Small, non-sensitive UI preferences. Credentials never go here. */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      notificationsPrimed: false,
      welcomeTourPending: false,
      setThemeMode: (themeMode) => set({ themeMode }),
      setNotificationsPrimed: (notificationsPrimed) => set({ notificationsPrimed }),
      setWelcomeTourPending: (welcomeTourPending) => set({ welcomeTourPending }),
    }),
    { name: 'lifemate.preferences', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API base URL, in priority order:
 * 1. EXPO_PUBLIC_API_URL (set in mobile/.env, or as an EAS build env var).
 *    It is public by design: it is a URL, not a secret.
 * 2. During development, the machine running Metro, so a phone on the same
 *    Wi-Fi reaches the local API without configuration.
 * 3. localhost (web preview / emulator with adb reverse).
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  if (__DEV__ && Platform.OS !== 'web') {
    const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.0.5:8081"
    const host = hostUri?.split(':')[0];
    if (host) return `http://${host}:4000/api/v1`;
  }
  return 'http://localhost:4000/api/v1';
}

export const API_URL = resolveApiUrl();
// Free-tier hosts (e.g. Render) sleep when idle and need up to ~50 s to wake.
export const REQUEST_TIMEOUT_MS = 60_000;

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Credentials live in the Android Keystore-backed SecureStore. The web build
 * (used only for development previews) has no secure enclave, so it falls
 * back to localStorage; it is not a supported production target.
 */
const isWeb = Platform.OS === 'web';

export async function getSecureItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setSecureItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      /* storage unavailable (private mode): session lasts until reload */
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const SECURE_KEYS = {
  refreshToken: 'lifemate.refreshToken',
  user: 'lifemate.user',
} as const;

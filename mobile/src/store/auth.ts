import { create } from 'zustand';
import { http, connectSession } from '@/services/api/client';
import { ApiError, toApiError } from '@/services/api/errors';
import { cancelAllReminders } from '@/services/notifications/reminders';
import { queryClient } from '@/services/query-client';
import { deleteSecureItem, getSecureItem, SECURE_KEYS, setSecureItem } from '@/services/storage/secure-storage';
import type { AuthPayload, User } from '@/types/api';

type Status = 'restoring' | 'signedOut' | 'signedIn';

interface AuthState {
  status: Status;
  user: User | null;
  /** Short-lived JWT, kept in memory only. */
  accessToken: string | null;
  restore: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
}

async function persistSession({ user, refreshToken }: Pick<AuthPayload, 'user' | 'refreshToken'>) {
  await setSecureItem(SECURE_KEYS.refreshToken, refreshToken);
  await setSecureItem(SECURE_KEYS.user, JSON.stringify(user));
}

async function clearSession() {
  await Promise.all([deleteSecureItem(SECURE_KEYS.refreshToken), deleteSecureItem(SECURE_KEYS.user)]);
}

export const useAuth = create<AuthState>()((set, get) => {
  /**
   * Exchanges the stored refresh token for a new pair. Returns the access
   * token, or null when the session is definitively over (401). Network
   * failures are rethrown so callers can keep the user signed in offline.
   */
  // Every refresh path (startup, 401 retry) shares one in-flight call.
  // Two concurrent refreshes would spend the same token twice, which the
  // server treats as replay and answers by ending the session.
  let inflight: Promise<string | null> | null = null;
  function refreshSession(): Promise<string | null> {
    inflight ??= doRefresh().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  async function doRefresh(): Promise<string | null> {
    const refreshToken = await getSecureItem(SECURE_KEYS.refreshToken);
    if (!refreshToken) return null;
    try {
      const res = await http.post<{ data: AuthPayload }>('/auth/refresh', { refreshToken });
      const payload = res.data.data;
      await persistSession(payload);
      set({ accessToken: payload.accessToken, user: payload.user, status: 'signedIn' });
      return payload.accessToken;
    } catch (err) {
      const apiErr = toApiError(err);
      if (apiErr.kind === 'unauthorized') return null;
      throw apiErr;
    }
  }

  connectSession({
    getAccessToken: () => get().accessToken,
    refresh: async () => {
      try {
        return await refreshSession();
      } catch {
        return null;
      }
    },
    onSessionExpired: () => {
      if (get().status === 'signedIn') void get().signOut();
    },
  });

  async function startSession(payload: AuthPayload) {
    await persistSession(payload);
    queryClient.clear();
    set({ status: 'signedIn', user: payload.user, accessToken: payload.accessToken });
  }

  return {
    status: 'restoring',
    user: null,
    accessToken: null,

    restore: async () => {
      const [refreshToken, cachedUser] = await Promise.all([
        getSecureItem(SECURE_KEYS.refreshToken),
        getSecureItem(SECURE_KEYS.user),
      ]);
      if (!refreshToken) {
        set({ status: 'signedOut' });
        return;
      }
      let user: User | null = null;
      try {
        user = cachedUser ? (JSON.parse(cachedUser) as User) : null;
      } catch {
        user = null;
      }

      if (user) {
        // Open straight into the app with the cached profile; the token is
        // refreshed in the background (or on the first 401).
        set({ status: 'signedIn', user });
        refreshSession()
          .then((token) => {
            if (token === null) void get().signOut();
          })
          .catch(() => {
            /* offline: stay signed in, requests will retry the refresh */
          });
        return;
      }

      try {
        const token = await refreshSession();
        if (!token) {
          await clearSession();
          set({ status: 'signedOut' });
        }
      } catch {
        // Offline with no cached profile: nothing useful to show yet.
        set({ status: 'signedOut' });
      }
    },

    signIn: async (email, password) => {
      const res = await http.post<{ data: AuthPayload }>('/auth/login', { email, password }).catch((e) => {
        throw toApiError(e);
      });
      await startSession(res.data.data);
    },

    register: async (name, email, password) => {
      const res = await http.post<{ data: AuthPayload }>('/auth/register', { name, email, password }).catch((e) => {
        throw toApiError(e);
      });
      await startSession(res.data.data);
    },

    signOut: async () => {
      const refreshToken = await getSecureItem(SECURE_KEYS.refreshToken);
      if (refreshToken) {
        // Best effort: revoke server-side, but never block signing out.
        http.post('/auth/logout', { refreshToken }).catch(() => {});
      }
      await clearSession();
      await cancelAllReminders().catch(() => {});
      queryClient.clear();
      set({ status: 'signedOut', user: null, accessToken: null });
    },

    setUser: (user) => {
      set({ user });
      void setSecureItem(SECURE_KEYS.user, JSON.stringify(user));
    },

    setAccessToken: (accessToken) => set({ accessToken }),
  };
});

export { ApiError };

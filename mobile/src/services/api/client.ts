import { create, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { API_URL, REQUEST_TIMEOUT_MS } from './config';
import { toApiError } from './errors';

/**
 * Session hooks the auth store registers at startup. Keeping them as
 * callbacks avoids an import cycle between the HTTP client and the store.
 */
interface SessionBridge {
  getAccessToken: () => string | null;
  /** Exchanges the stored refresh token; resolves to a new access token or null. */
  refresh: () => Promise<string | null>;
  /** Called when the session cannot be recovered. */
  onSessionExpired: () => void;
}

let bridge: SessionBridge = {
  getAccessToken: () => null,
  refresh: async () => null,
  onSessionExpired: () => {},
};

export function connectSession(next: SessionBridge) {
  bridge = next;
}

export const http = create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = bridge.getAccessToken();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Single-flight refresh: if several requests fail with 401 at once, they all
// wait for one refresh call instead of racing to rotate the token (a race
// would look like token replay to the server and end the session).
let refreshing: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  refreshing ??= bridge.refresh().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthCall = config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && config && !config._retried && !isAuthCall) {
      config._retried = true;
      const token = await refreshOnce();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        return http(config);
      }
      bridge.onSessionExpired();
    }
    throw toApiError(error);
  },
);

/** Typed helpers that unwrap the `{ data }` envelope. */
export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await http.get<{ data: T }>(url, config)).data.data;
  },
  async getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await http.get<T>(url, config)).data;
  },
  async post<T>(url: string, body?: unknown): Promise<T> {
    return (await http.post<{ data: T }>(url, body)).data?.data as T;
  },
  async postRaw<T>(url: string, body?: unknown): Promise<T> {
    return (await http.post<T>(url, body)).data;
  },
  async patch<T>(url: string, body: unknown): Promise<T> {
    return (await http.patch<{ data: T }>(url, body)).data.data;
  },
  async put<T>(url: string, body: unknown): Promise<T> {
    return (await http.put<{ data: T }>(url, body)).data.data;
  },
  async delete(url: string, body?: unknown): Promise<void> {
    await http.delete(url, body ? { data: body } : undefined);
  },
};

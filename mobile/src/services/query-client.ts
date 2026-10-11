import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import { ApiError } from './api/errors';

/**
 * Server state lives in TanStack Query; the API is the source of truth.
 * Data is refetched when the app returns to the foreground, which is how
 * edits made on another device appear here (proposal: cloud sync).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 10 * 60_000,
      retry: (count, err) => err instanceof ApiError && err.isRetryable && count < 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 6000),
    },
    mutations: { retry: false },
  },
});

if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    focusManager.setFocused(state === 'active');
  });
}

/** Query keys in one place so invalidation stays consistent. */
export const qk = {
  dashboard: (today: string) => ['dashboard', today] as const,
  dashboardAll: ['dashboard'] as const,
  tasks: (status: 'open' | 'completed') => ['tasks', status] as const,
  tasksAll: ['tasks'] as const,
  task: (id: string) => ['tasks', 'detail', id] as const,
  expenses: (month: string) => ['expenses', month] as const,
  expensesAll: ['expenses'] as const,
  summary: (month: string) => ['summary', month] as const,
  summaryAll: ['summary'] as const,
  budget: (month: string) => ['budget', month] as const,
  budgetAll: ['budget'] as const,
  bills: (status: 'unpaid' | 'paid') => ['bills', status] as const,
  billsAll: ['bills'] as const,
  groceryLists: ['grocery-lists'] as const,
  groceryList: (id: string) => ['grocery-lists', id] as const,
  notes: ['notes'] as const,
  me: ['me'] as const,
};

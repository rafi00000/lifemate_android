import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api, http } from '@/services/api/client';
import { qk } from '@/services/query-client';
import type { BudgetAlert, BudgetPlan, Expense, ExpenseInput, MonthSummary, Paged } from '@/types/api';

export function useMonthSummary(month: string) {
  return useQuery({
    queryKey: qk.summary(month),
    queryFn: () => api.get<MonthSummary>('/expenses/summary', { params: { month } }),
    placeholderData: (prev) => prev, // keep the previous month visible while switching
  });
}

export function useMonthExpenses(month: string) {
  return useInfiniteQuery({
    queryKey: qk.expenses(month),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.getRaw<Paged<Expense>>('/expenses', { params: { month, limit: 50, cursor: pageParam ?? undefined } }),
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useBudget(month: string) {
  return useQuery({
    queryKey: qk.budget(month),
    queryFn: () => api.get<BudgetPlan>(`/budgets/${month}`),
  });
}

/** Anything that changes spending refreshes every view that shows money. */
export const invalidateMoney = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: qk.expensesAll }),
    qc.invalidateQueries({ queryKey: qk.summaryAll }),
    qc.invalidateQueries({ queryKey: qk.budgetAll }),
    qc.invalidateQueries({ queryKey: qk.dashboardAll }),
  ]);

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ExpenseInput) => {
      const res = await http.post<{ data: Expense; alerts: BudgetAlert[] }>('/expenses', input);
      return res.data;
    },
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ExpenseInput> }) => api.patch<Expense>(`/expenses/${id}`, input),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => invalidateMoney(qc),
  });
}

export function useSaveBudget(month: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Pick<BudgetPlan, 'overall' | 'categories'>) => api.put<BudgetPlan>(`/budgets/${month}`, input),
    onSuccess: (plan) => {
      qc.setQueryData(qk.budget(month), plan);
      void invalidateMoney(qc);
    },
  });
}

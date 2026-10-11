import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/services/api/client';
import { qk } from '@/services/query-client';
import type { Bill, BillInput } from '@/types/api';
import { todayString } from '@/utils/date';
import { invalidateMoney } from '../money/api';

export function useBills(status: 'unpaid' | 'paid' = 'unpaid', enabled = true) {
  return useQuery({
    queryKey: qk.bills(status),
    enabled,
    queryFn: () => api.get<Bill[]>('/bills', { params: { status } }),
  });
}

export function useBill(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['bills', 'detail', id],
    enabled: !!id,
    queryFn: () => api.get<Bill>(`/bills/${id}`),
    initialData: () => qc.getQueryData<Bill[]>(qk.bills('unpaid'))?.find((b) => b.id === id),
  });
}

const invalidateBills = (qc: QueryClient) =>
  Promise.all([qc.invalidateQueries({ queryKey: qk.billsAll }), qc.invalidateQueries({ queryKey: qk.dashboardAll })]);

export function useSaveBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: BillInput }) =>
      id ? api.patch<Bill>(`/bills/${id}`, input) : api.post<Bill>('/bills', input),
    onSuccess: () => invalidateBills(qc),
  });
}

export function useDeleteBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/bills/${id}`),
    onSuccess: () => invalidateBills(qc),
  });
}

export function usePayBill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bill, logExpense }: { bill: Bill; logExpense: boolean }) =>
      api.post<Bill>(`/bills/${bill.id}/pay`, { dueDate: bill.dueDate, paidOn: todayString(), logExpense }),
    onSettled: () => Promise.all([invalidateBills(qc), invalidateMoney(qc)]),
  });
}

export function useUndoBillPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Bill>(`/bills/${id}/undo-payment`),
    onSettled: () => Promise.all([invalidateBills(qc), invalidateMoney(qc)]),
  });
}

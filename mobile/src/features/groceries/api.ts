import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/services/api/client';
import { qk } from '@/services/query-client';
import type { GroceryItem, GroceryListDetail, GroceryListSummary } from '@/types/api';

export function useGroceryLists() {
  return useQuery({ queryKey: qk.groceryLists, queryFn: () => api.get<GroceryListSummary[]>('/grocery-lists') });
}

export function useGroceryList(id: string) {
  return useQuery({
    queryKey: qk.groceryList(id),
    queryFn: () => api.get<GroceryListDetail>(`/grocery-lists/${id}`),
    // Shared lists change on other phones; poll gently while open.
    refetchInterval: 20_000,
  });
}

const invalidateLists = (qc: QueryClient, id?: string) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: qk.groceryLists, exact: true }),
    id ? qc.invalidateQueries({ queryKey: qk.groceryList(id) }) : null,
    qc.invalidateQueries({ queryKey: qk.dashboardAll }),
  ]);

export function useCreateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<GroceryListSummary>('/grocery-lists', { name }),
    onSuccess: () => invalidateLists(qc),
  });
}

export function useRenameList(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.patch<GroceryListDetail>(`/grocery-lists/${id}`, { name }),
    onSuccess: (list) => {
      qc.setQueryData(qk.groceryList(id), list);
      void invalidateLists(qc);
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/grocery-lists/${id}`),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: qk.groceryList(id) });
      void invalidateLists(qc);
    },
  });
}

/** Optimistic helpers: the list updates instantly; the server confirms. */
function useItemMutation<V>(listId: string, mutationFn: (v: V) => Promise<unknown>, apply: (items: GroceryItem[], v: V) => GroceryItem[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: async (v: V) => {
      await qc.cancelQueries({ queryKey: qk.groceryList(listId) });
      const previous = qc.getQueryData<GroceryListDetail>(qk.groceryList(listId));
      if (previous) {
        const items = apply(previous.items, v);
        qc.setQueryData<GroceryListDetail>(qk.groceryList(listId), {
          ...previous,
          items,
          pendingItems: items.filter((i) => !i.purchased).length,
          totalItems: items.length,
        });
      }
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.groceryList(listId), ctx.previous);
    },
    onSettled: () => invalidateLists(qc, listId),
  });
}

let tempId = 0;

export function useAddItem(listId: string) {
  return useItemMutation(
    listId,
    (input: { name: string; quantity: number; unit: string }) => api.post<GroceryItem>(`/grocery-lists/${listId}/items`, input),
    (items, input) => [
      ...items,
      {
        id: `temp-${++tempId}`,
        list: listId,
        ...input,
        purchased: false,
        purchasedAt: null,
        createdAt: new Date().toISOString(),
      },
    ],
  );
}

export function useToggleItem(listId: string) {
  return useItemMutation(
    listId,
    ({ id, purchased }: { id: string; purchased: boolean }) => api.patch(`/grocery-lists/${listId}/items/${id}`, { purchased }),
    (items, { id, purchased }) => items.map((i) => (i.id === id ? { ...i, purchased } : i)),
  );
}

export function useUpdateItem(listId: string) {
  return useItemMutation(
    listId,
    ({ id, input }: { id: string; input: { name?: string; quantity?: number; unit?: string } }) =>
      api.patch(`/grocery-lists/${listId}/items/${id}`, input),
    (items, { id, input }) => items.map((i) => (i.id === id ? { ...i, ...input } : i)),
  );
}

export function useDeleteItem(listId: string) {
  return useItemMutation(
    listId,
    (id: string) => api.delete(`/grocery-lists/${listId}/items/${id}`),
    (items, id) => items.filter((i) => i.id !== id),
  );
}

export function useClearPurchased(listId: string) {
  return useItemMutation(
    listId,
    () => api.post(`/grocery-lists/${listId}/clear-purchased`),
    (items) => items.filter((i) => !i.purchased),
  );
}

export function useShareList(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => api.post<GroceryListDetail>(`/grocery-lists/${listId}/members`, { email }),
    onSuccess: (list) => {
      qc.setQueryData(qk.groceryList(listId), list);
      void invalidateLists(qc);
    },
  });
}

export function useRemoveMember(listId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/grocery-lists/${listId}/members/${userId}`),
    onSuccess: () => invalidateLists(qc, listId),
  });
}

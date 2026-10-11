import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/services/api/client';
import { qk } from '@/services/query-client';
import type { Dashboard, Paged, Task, TaskInput } from '@/types/api';
import { todayString } from '@/utils/date';

export function useOpenTasks() {
  return useQuery({
    queryKey: qk.tasks('open'),
    queryFn: async () => (await api.getRaw<Paged<Task>>('/tasks', { params: { status: 'open', limit: 200 } })).data,
  });
}

export function useCompletedTasks(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: qk.tasks('completed'),
    enabled,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api.getRaw<Paged<Task>>('/tasks', { params: { status: 'completed', limit: 30, cursor: pageParam ?? undefined } }),
    getNextPageParam: (last) => last.nextCursor,
  });
}

export function useTask(id: string | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: qk.task(id ?? 'new'),
    enabled: !!id,
    queryFn: () => api.get<Task>(`/tasks/${id}`),
    // Open the editor instantly from the list cache, then refresh.
    initialData: () => qc.getQueryData<Task[]>(qk.tasks('open'))?.find((t) => t.id === id),
  });
}

/** Apply a change to a task wherever it is cached (lists, dashboard). */
function patchTaskCaches(qc: QueryClient, id: string, patch: (t: Task) => Task) {
  qc.setQueryData<Task[]>(qk.tasks('open'), (list) => list?.map((t) => (t.id === id ? patch(t) : t)));
  qc.setQueriesData<Dashboard>({ queryKey: qk.dashboardAll }, (d) =>
    d ? { ...d, tasks: { ...d.tasks, items: d.tasks.items.map((t) => (t.id === id ? patch(t) : t)) } } : d,
  );
}

const invalidateTasks = (qc: QueryClient) =>
  Promise.all([qc.invalidateQueries({ queryKey: qk.tasksAll }), qc.invalidateQueries({ queryKey: qk.dashboardAll })]);

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<TaskInput> & { title: string }) => api.post<Task>('/tasks', input),
    onSuccess: (task) => {
      qc.setQueryData<Task[]>(qk.tasks('open'), (list) => (list ? [...list, task] : list));
      void invalidateTasks(qc);
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<TaskInput> }) => api.patch<Task>(`/tasks/${id}`, input),
    onSuccess: (task) => {
      patchTaskCaches(qc, task.id, () => task);
      qc.setQueryData(qk.task(task.id), task);
      void invalidateTasks(qc);
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: qk.tasks('open') });
      const previous = qc.getQueryData<Task[]>(qk.tasks('open'));
      qc.setQueryData<Task[]>(qk.tasks('open'), (list) => list?.filter((t) => t.id !== id));
      return { previous };
    },
    onError: (_e, _id, ctx) => qc.setQueryData(qk.tasks('open'), ctx?.previous),
    onSettled: () => invalidateTasks(qc),
  });
}

/**
 * Complete / reopen with an optimistic tick: the checkbox animates at once,
 * and the list settles to the server's answer a moment later (a recurring
 * task reappears on its next date). Errors roll back.
 */
export function useToggleTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ task, complete }: { task: Task; complete: boolean }) =>
      complete ? api.post<Task>(`/tasks/${task.id}/complete`, { today: todayString() }) : api.post<Task>(`/tasks/${task.id}/reopen`),
    onMutate: async ({ task, complete }) => {
      await qc.cancelQueries({ queryKey: qk.tasksAll });
      const snapshot = {
        open: qc.getQueryData<Task[]>(qk.tasks('open')),
        dashboards: qc.getQueriesData<Dashboard>({ queryKey: qk.dashboardAll }),
      };
      patchTaskCaches(qc, task.id, (t) => ({ ...t, completed: complete }));
      return snapshot;
    },
    onError: (_e, _v, snapshot) => {
      qc.setQueryData(qk.tasks('open'), snapshot?.open);
      snapshot?.dashboards.forEach(([key, data]) => qc.setQueryData(key, data));
    },
    onSettled: () => {
      // Let the completion animation play before the row leaves the list.
      setTimeout(() => void invalidateTasks(qc), 650);
    },
  });
}

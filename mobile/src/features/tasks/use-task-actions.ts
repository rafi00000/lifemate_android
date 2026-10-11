import { router } from 'expo-router';
import { useCallback } from 'react';
import { useToast } from '@/components/feedback/toast';
import { errorMessage } from '@/services/api/errors';
import type { Task } from '@/types/api';
import { relativeDayLabel } from '@/utils/date';
import { useToggleTask } from './api';

/** Shared toggle/open behaviour for every place a task row appears. */
export function useTaskActions() {
  const toggle = useToggleTask();
  const toast = useToast();

  const onToggle = useCallback(
    (task: Task) => {
      const complete = !task.completed;
      toggle.mutate(
        { task, complete },
        {
          onSuccess: (updated) => {
            if (!complete) return;
            const message =
              task.recurrence !== 'none' && updated.dueDate
                ? `Done. Next: ${relativeDayLabel(updated.dueDate)}`
                : 'Task completed';
            toast.success(message, { label: 'Undo', onPress: () => toggle.mutate({ task: updated, complete: false }) });
          },
          onError: (err) => toast.error(errorMessage(err)),
        },
      );
    },
    [toggle, toast],
  );

  const onOpen = useCallback((task: Task) => {
    router.push({ pathname: '/task-editor', params: { id: task.id } });
  }, []);

  return { onToggle, onOpen };
}

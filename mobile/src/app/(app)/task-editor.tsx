import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useConfirm } from '@/components/feedback/dialog';
import { SkeletonList } from '@/components/feedback/skeleton';
import { ErrorState } from '@/components/feedback/states';
import { useToast } from '@/components/feedback/toast';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DueDateField } from '@/components/ui/date-picker';
import { IconButton } from '@/components/ui/icon-button';
import { TextField } from '@/components/ui/text-field';
import { TimePicker } from '@/components/ui/time-picker';
import { EditorScaffold } from '@/features/forms/editor-scaffold';
import { FormSection } from '@/features/forms/form-section';
import { useEnsureNotificationPermission } from '@/features/reminders/use-ensure-permission';
import { useCreateTask, useDeleteTask, useTask, useUpdateTask } from '@/features/tasks/api';
import { REMINDER_OPTIONS } from '@/features/tasks/task-meta';
import { errorMessage, toApiError } from '@/services/api/errors';
import type { Priority, Task, TaskInput, TaskRecurrence } from '@/types/api';
import { validateRequired } from '@/utils/validation';
import { goBack } from '@/utils/navigation';

type Params = { id?: string; title?: string; dueDate?: string; priority?: Priority };

export default function TaskEditorScreen() {
  const params = useLocalSearchParams<Params>();
  const existing = useTask(params.id);

  if (params.id && !existing.data) {
    return (
      <EditorScaffold title="Task" footer={null}>
        {existing.isError ? <ErrorState message={errorMessage(existing.error)} onRetry={() => void existing.refetch()} /> : <SkeletonList count={4} />}
      </EditorScaffold>
    );
  }
  return <TaskForm task={existing.data} params={params} />;
}

function initialForm(task: Task | undefined, params: Params): TaskInput {
  if (task) {
    const { title, notes, priority, dueDate, dueTime, recurrence, reminderMinutesBefore } = task;
    return { title, notes, priority, dueDate, dueTime, recurrence, reminderMinutesBefore };
  }
  return {
    title: params.title ?? '',
    notes: '',
    priority: params.priority ?? 'medium',
    dueDate: params.dueDate ? params.dueDate : null,
    dueTime: null,
    recurrence: 'none',
    reminderMinutesBefore: null,
  };
}

function TaskForm({ task, params }: { task?: Task; params: Params }) {
  const editing = !!task;
  const create = useCreateTask();
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const confirm = useConfirm();
  const toast = useToast();
  const ensurePermission = useEnsureNotificationPermission();
  const [form, setForm] = useState<TaskInput>(() => initialForm(task, params));
  const [errors, setErrors] = useState<{ title?: string; form?: string }>({});

  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  // Time, repeat and reminder only make sense with a date.
  const setDate = (dueDate: string | null) =>
    setForm((f) => (dueDate ? { ...f, dueDate } : { ...f, dueDate: null, dueTime: null, recurrence: 'none', reminderMinutesBefore: null }));

  const save = async () => {
    const titleError = validateRequired(form.title, 'Title', 200);
    setErrors({ title: titleError });
    if (titleError) return;
    const input = { ...form, title: form.title.trim(), notes: form.notes.trim() };
    try {
      if (task) await update.mutateAsync({ id: task.id, input });
      else await create.mutateAsync(input);
      if (input.reminderMinutesBefore != null) await ensurePermission();
      toast.success(editing ? 'Task updated' : 'Task added');
      goBack();
    } catch (err) {
      const apiErr = toApiError(err);
      setErrors({ title: apiErr.fieldErrors.title, form: apiErr.message });
    }
  };

  const destroy = async () => {
    if (!task) return;
    const ok = await confirm({
      title: 'Delete this task?',
      message: 'It will be removed from all your devices.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(task.id, {
      onSuccess: () => toast.success('Task deleted'),
      onError: (err) => toast.error(errorMessage(err)),
    });
    goBack();
  };

  const reminderOptions = form.dueTime
    ? REMINDER_OPTIONS
    : REMINDER_OPTIONS.slice(0, 2).map((o) => (o.value === '0' ? { ...o, label: 'Remind me' } : o));

  return (
    <EditorScaffold
      title={editing ? 'Edit task' : 'New task'}
      headerRight={editing ? <IconButton icon="trash-2" label="Delete task" tone="dangerText" onPress={destroy} /> : null}
      footer={<Button label={editing ? 'Save changes' : 'Add task'} size="lg" fullWidth onPress={save} loading={create.isPending || update.isPending} testID="task-save" />}>
      <TextField
        label="Title"
        value={form.title}
        onChangeText={(v) => set('title', v)}
        error={errors.title ?? errors.form}
        placeholder="What needs doing?"
        autoFocus={!editing && !form.title}
        maxLength={200}
        testID="task-title"
      />
      <FormSection label="Due date" icon="calendar">
        <DueDateField value={form.dueDate} onChange={setDate} />
      </FormSection>
      {form.dueDate ? (
        <>
          <FormSection label="Time" icon="clock">
            <TimePicker
              value={form.dueTime}
              onChange={(time) =>
                setForm((f) => ({
                  ...f,
                  dueTime: time,
                  // Minutes-before only applies with a time; otherwise "morning of".
                  reminderMinutesBefore: f.reminderMinutesBefore == null ? null : time ? f.reminderMinutesBefore : 0,
                }))
              }
            />
          </FormSection>
          <FormSection label="Repeat" icon="repeat">
            <ChipGroup<TaskRecurrence>
              scroll
              value={form.recurrence}
              onChange={(v) => set('recurrence', v)}
              options={[
                { value: 'none', label: 'Never' },
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
              ]}
            />
          </FormSection>
          <FormSection
            label="Reminder"
            icon="bell"
            hint={form.reminderMinutesBefore != null && !form.dueTime ? 'Without a time, we’ll remind you at 9:00 AM that day.' : undefined}>
            <ChipGroup
              scroll
              value={form.reminderMinutesBefore == null ? 'none' : String(form.reminderMinutesBefore)}
              onChange={(v) => set('reminderMinutesBefore', REMINDER_OPTIONS.find((o) => o.value === v)?.minutes ?? null)}
              options={reminderOptions.map((o) => ({ value: o.value, label: o.label, icon: o.minutes == null ? ('bell-off' as const) : undefined }))}
            />
          </FormSection>
        </>
      ) : null}
      <FormSection label="Priority" icon="flag">
        <ChipGroup<Priority>
          value={form.priority}
          onChange={(v) => set('priority', v)}
          options={[
            { value: 'low', label: 'Low', icon: 'arrow-down' },
            { value: 'medium', label: 'Medium', icon: 'minus' },
            { value: 'high', label: 'High', icon: 'flag' },
          ]}
        />
      </FormSection>
      <FormSection label="Notes" icon="align-left">
        <TextField value={form.notes} onChangeText={(v) => set('notes', v)} placeholder="Add details (optional)" multiline maxLength={2000} />
      </FormSection>
    </EditorScaffold>
  );
}

import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useToast } from '@/components/feedback/toast';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ChipGroup } from '@/components/ui/chip';
import { DueDateField } from '@/components/ui/date-picker';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { errorMessage } from '@/services/api/errors';
import { makeStyles } from '@/theme';
import type { Priority } from '@/types/api';
import { todayString } from '@/utils/date';
import { validateRequired } from '@/utils/validation';
import { useCreateTask } from './api';

interface QuickAddTaskSheetProps {
  visible: boolean;
  onClose: () => void;
  /** undefined = today; null = no date. */
  defaultDate?: string | null;
}

/**
 * Fastest path to capture a task (proposal: "add a task within a few
 * taps"): type, optionally tap a day, add. Everything else lives behind
 * "More options".
 */
export function QuickAddTaskSheet({ visible, onClose, defaultDate }: QuickAddTaskSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="New task" testID="quick-add-task">
      <QuickAddTaskForm onClose={onClose} defaultDate={defaultDate === undefined ? todayString() : defaultDate} />
    </BottomSheet>
  );
}

function QuickAddTaskForm({ onClose, defaultDate }: { onClose: () => void; defaultDate: string | null }) {
  const styles = useStyles();
  const toast = useToast();
  const create = useCreateTask();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(defaultDate);
  const [priority, setPriority] = useState<Priority>('medium');
  const [error, setError] = useState<string | undefined>();

  const submit = () => {
    const problem = validateRequired(title, 'Task', 200);
    setError(problem);
    if (problem) return;
    create.mutate(
      { title: title.trim(), dueDate, priority },
      {
        onSuccess: () => {
          toast.success('Task added');
          onClose();
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  return (
    <View style={styles.body}>
      <TextField
        placeholder="What needs doing?"
        value={title}
        onChangeText={setTitle}
        error={error}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={submit}
        accessibilityLabel="Task title"
        testID="quick-add-title"
      />
      <DueDateField value={dueDate} onChange={setDueDate} />
      <ChipGroup<Priority>
        accessibilityLabel="Priority"
        value={priority}
        onChange={setPriority}
        options={[
          { value: 'low', label: 'Low', icon: 'arrow-down' },
          { value: 'medium', label: 'Medium', icon: 'minus' },
          { value: 'high', label: 'High', icon: 'flag' },
        ]}
      />
      <View style={styles.footer}>
        <Pressable
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="More options: time, repeat and reminder"
          style={styles.more}
          onPress={() => {
            onClose();
            router.push({ pathname: '/task-editor', params: { title, dueDate: dueDate ?? '', priority } });
          }}>
          <Icon name="sliders" size={16} tone="primary" />
          <Text variant="label" tone="primary">
            More options
          </Text>
        </Pressable>
        <Button label="Add task" icon="plus" onPress={submit} loading={create.isPending} testID="quick-add-submit" />
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  body: { gap: t.space.lg, paddingBottom: t.space.xs },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: t.space.xs },
  more: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs + 2, paddingVertical: t.space.sm },
}));

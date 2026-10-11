import { memo } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { enterFade, exitFade, layoutTransition, makeStyles, useTheme } from '@/theme';
import type { Task } from '@/types/api';
import { formatTime, relativeDayLabel, todayString } from '@/utils/date';
import { PRIORITY_LABEL } from './task-meta';

interface TaskRowProps {
  task: Task;
  onToggle: (task: Task) => void;
  onPress: (task: Task) => void;
  /** Show the date in the meta line (when the section isn't already a day). */
  showDate?: boolean;
}

export const TaskRow = memo(function TaskRow({ task, onToggle, onPress, showDate = false }: TaskRowProps) {
  const t = useTheme();
  const styles = useStyles();
  const today = todayString();
  const overdue = !task.completed && !!task.dueDate && task.dueDate < today;
  const ring = task.priority === 'high' ? t.colors.danger : task.priority === 'medium' ? t.colors.warning : t.colors.borderStrong;

  const meta: string[] = [];
  if (task.dueDate && (showDate || overdue)) meta.push(relativeDayLabel(task.dueDate, today));
  if (task.dueTime) meta.push(formatTime(task.dueTime));

  const a11y = [
    task.title,
    task.completed ? 'completed' : null,
    `${PRIORITY_LABEL[task.priority]} priority`,
    meta.join(', ') || null,
    task.recurrence !== 'none' ? `repeats ${task.recurrence}` : null,
    task.reminderMinutesBefore != null ? 'reminder on' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Animated.View entering={enterFade} exiting={exitFade} layout={layoutTransition}>
      <View style={styles.row}>
        <Checkbox
          checked={task.completed}
          onToggle={() => onToggle(task)}
          ringColor={ring}
          label={`${task.completed ? 'Mark as not done' : 'Complete'}: ${task.title}`}
          testID={`task-check-${task.id}`}
        />
        <Pressable
          style={styles.body}
          onPress={() => onPress(task)}
          accessibilityRole="button"
          accessibilityLabel={a11y}
          accessibilityHint="Opens the task to edit">
          <Text
            variant="bodyMedium"
            numberOfLines={2}
            tone={task.completed ? 'textTertiary' : 'text'}
            style={task.completed && styles.done}>
            {task.title}
          </Text>
          {meta.length || task.recurrence !== 'none' || task.reminderMinutesBefore != null || task.notes ? (
            <View style={styles.meta}>
              {meta.length ? (
                <Text variant="caption" tone={overdue ? 'dangerText' : 'textSecondary'}>
                  {meta.join(' · ')}
                </Text>
              ) : null}
              {task.recurrence !== 'none' ? <Icon name="repeat" size={13} tone="textTertiary" /> : null}
              {task.reminderMinutesBefore != null ? <Icon name="bell" size={13} tone="textTertiary" /> : null}
              {task.notes ? <Icon name="align-left" size={13} tone="textTertiary" /> : null}
            </View>
          ) : null}
        </Pressable>
        {task.priority === 'high' && !task.completed ? (
          <View style={styles.flag} accessibilityElementsHidden>
            <Icon name="flag" size={14} tone="dangerText" />
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
});

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md, minHeight: 60 },
  body: { flex: 1, gap: 3, justifyContent: 'center', minHeight: 44 },
  done: { textDecorationLine: 'line-through' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  flag: { paddingHorizontal: t.space.xs },
}));

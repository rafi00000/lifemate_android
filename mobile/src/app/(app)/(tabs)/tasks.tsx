import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SkeletonList } from '@/components/feedback/skeleton';
import { EmptyState, ErrorState } from '@/components/feedback/states';
import { PageTitle } from '@/components/layout/headers';
import { Screen } from '@/components/layout/screen';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { Divider } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useCompletedTasks, useOpenTasks } from '@/features/tasks/api';
import { groupTasks, taskCounts, type TaskFilter } from '@/features/tasks/grouping';
import { QuickAddTaskSheet } from '@/features/tasks/quick-add-sheet';
import { TaskRow } from '@/features/tasks/task-row';
import { useTaskActions } from '@/features/tasks/use-task-actions';
import { errorMessage } from '@/services/api/errors';
import { enterCard, makeStyles } from '@/theme';
import { todayString } from '@/utils/date';

type Filter = TaskFilter | 'done';

const EMPTY: Record<Filter, { title: string; message: string }> = {
  today: { title: 'Nothing due today', message: 'Enjoy the space, or plan something for later.' },
  upcoming: { title: 'No upcoming tasks', message: 'Tasks with a future date will gather here.' },
  all: { title: 'Your list is clear', message: 'Add the first thing on your mind.' },
  done: { title: 'Nothing completed yet', message: 'Finished tasks will appear here.' },
};

export default function TasksScreen() {
  const styles = useStyles();
  const today = todayString();
  const [filter, setFilter] = useState<Filter>('today');
  const [adding, setAdding] = useState(false);
  const open = useOpenTasks();
  const done = useCompletedTasks(filter === 'done');
  const { onToggle, onOpen } = useTaskActions();

  const counts = useMemo(() => taskCounts(open.data ?? [], today), [open.data, today]);
  const sections = useMemo(
    () => (filter === 'done' ? [] : groupTasks(open.data ?? [], today, filter)),
    [open.data, today, filter],
  );
  const doneTasks = useMemo(() => done.data?.pages.flatMap((p) => p.data) ?? [], [done.data]);

  const subtitle =
    counts.today + counts.overdue === 0
      ? 'You’re all caught up'
      : [counts.today ? `${counts.today} due today` : null, counts.overdue ? `${counts.overdue} overdue` : null].filter(Boolean).join(' · ');

  const loading = filter === 'done' ? done.isPending : open.isPending;
  const error = filter === 'done' ? done.error : open.error;
  const refetch = filter === 'done' ? done.refetch : open.refetch;

  return (
    <>
      <Screen withTabBar withFab onRefresh={() => Promise.all([open.refetch(), filter === 'done' ? done.refetch() : null])}>
        <PageTitle title="Tasks" subtitle={open.data ? subtitle : undefined} />
        <SegmentedControl<Filter>
          accessibilityLabel="Task filter"
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'today', label: 'Today', count: counts.today + counts.overdue },
            { value: 'upcoming', label: 'Upcoming', count: counts.upcoming },
            { value: 'all', label: 'All' },
            { value: 'done', label: 'Done' },
          ]}
        />

        <View style={styles.content}>
          {loading ? (
            <Card style={styles.group}>
              <SkeletonList count={4} />
            </Card>
          ) : error ? (
            <ErrorState message={errorMessage(error)} onRetry={() => void refetch()} />
          ) : filter === 'done' ? (
            doneTasks.length === 0 ? (
              <EmptyState icon="check-circle" {...EMPTY.done} />
            ) : (
              <Animated.View entering={enterCard(0)}>
                <Card style={styles.group} padded={false}>
                  <View style={styles.groupInner}>
                    {doneTasks.map((task, i) => (
                      <View key={task.id}>
                        {i > 0 ? <Divider inset={38} /> : null}
                        <TaskRow task={task} onToggle={onToggle} onPress={onOpen} showDate />
                      </View>
                    ))}
                  </View>
                </Card>
                {done.hasNextPage ? (
                  <Button label="Show more" variant="ghost" loading={done.isFetchingNextPage} onPress={() => void done.fetchNextPage()} />
                ) : null}
              </Animated.View>
            )
          ) : sections.length === 0 ? (
            <EmptyState
              icon={filter === 'today' ? 'sun' : 'inbox'}
              {...EMPTY[filter]}
              actionLabel="Add a task"
              onAction={() => setAdding(true)}
            />
          ) : (
            sections.map((section, si) => (
              <Animated.View key={section.key} entering={enterCard(si)} style={styles.section}>
                <Text variant="overline" tone={section.tone === 'danger' ? 'dangerText' : 'textSecondary'} style={styles.sectionTitle}>
                  {section.title} · {section.tasks.length}
                </Text>
                <Card padded={false}>
                  <View style={styles.groupInner}>
                    {section.tasks.map((task, i) => (
                      <View key={task.id}>
                        {i > 0 ? <Divider inset={38} /> : null}
                        <TaskRow task={task} onToggle={onToggle} onPress={onOpen} showDate={filter === 'all' && section.key !== 'today'} />
                      </View>
                    ))}
                  </View>
                </Card>
              </Animated.View>
            ))
          )}
        </View>
      </Screen>
      <Fab label="Add task" onPress={() => setAdding(true)} testID="tasks-fab" />
      <QuickAddTaskSheet visible={adding} onClose={() => setAdding(false)} defaultDate={filter === 'all' ? null : undefined} />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  content: { marginTop: t.space.xl },
  section: { marginBottom: t.space.xl },
  sectionTitle: { marginBottom: t.space.sm, marginLeft: t.space.xs },
  group: { marginBottom: t.space.md },
  groupInner: { paddingHorizontal: t.space.lg },
}));

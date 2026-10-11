import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Skeleton } from '@/components/feedback/skeleton';
import { ErrorState } from '@/components/feedback/states';
import { SectionHeader } from '@/components/layout/headers';
import { Screen } from '@/components/layout/screen';
import { AnimatedAmount } from '@/components/ui/animated-amount';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Avatar, Divider, Pill } from '@/components/ui/misc';
import { ProgressBar, ProgressRing, useStateColor } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { CATEGORY_META } from '@/constants/categories';
import { BillRow } from '@/features/bills/bill-row';
import { PayBillSheet } from '@/features/bills/pay-bill-sheet';
import { useDashboard } from '@/features/dashboard/api';
import { QuickActions } from '@/features/dashboard/quick-actions';
import { AddExpenseSheet } from '@/features/money/add-expense-sheet';
import { budgetHeadline, categoryWarning } from '@/features/money/budget-copy';
import { QuickAddTaskSheet } from '@/features/tasks/quick-add-sheet';
import { TaskRow } from '@/features/tasks/task-row';
import { useTaskActions } from '@/features/tasks/use-task-actions';
import { useToday } from '@/hooks/use-today';
import { errorMessage } from '@/services/api/errors';
import { useAuth } from '@/store/auth';
import { enterCard, makeStyles, useTheme } from '@/theme';
import type { Bill, Dashboard } from '@/types/api';
import { daysInMonth, formatLongDate, formatMonth, greetingFor, parseParts } from '@/utils/date';
import { formatMoney } from '@/utils/money';

export default function TodayScreen() {
  const styles = useStyles();
  const today = useToday();
  const user = useAuth((s) => s.user);
  const dashboard = useDashboard(today);
  const [sheet, setSheet] = useState<'task' | 'expense' | null>(null);
  const [paying, setPaying] = useState<Bill | null>(null);
  const firstName = user?.name.split(' ')[0] ?? 'there';
  const d = dashboard.data;

  return (
    <>
      <Screen withTabBar onRefresh={() => dashboard.refetch()} testID="today-screen">
        <Animated.View entering={enterCard(0)} style={styles.header}>
          <View style={styles.flex}>
            <Text variant="overline" tone="textSecondary">
              {formatLongDate(today)}
            </Text>
            <Text variant="display" accessibilityRole="header" style={styles.greeting} numberOfLines={2}>
              {greetingFor()}, {firstName}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Profile and settings" hitSlop={8}>
            <Avatar name={user?.name ?? '?'} size={44} />
          </Pressable>
        </Animated.View>

        {dashboard.isPending ? (
          <DashboardSkeleton />
        ) : dashboard.isError && !d ? (
          <ErrorState message={errorMessage(dashboard.error)} onRetry={() => void dashboard.refetch()} retrying={dashboard.isFetching} />
        ) : d ? (
          <>
            <Animated.View entering={enterCard(1)}>
              <DayOverview data={d} />
            </Animated.View>

            <Animated.View entering={enterCard(2)} style={styles.quick}>
              <QuickActions
                actions={[
                  { key: 'task', label: 'Task', icon: 'check-circle', onPress: () => setSheet('task') },
                  { key: 'expense', label: 'Expense', icon: 'credit-card', onPress: () => setSheet('expense') },
                  { key: 'bill', label: 'Bill', icon: 'calendar', onPress: () => router.push('/bill-editor') },
                  { key: 'grocery', label: 'Grocery', icon: 'shopping-cart', onPress: () => router.push('/lists') },
                ]}
              />
            </Animated.View>

            {isBrandNew(d) ? <GettingStarted onAddTask={() => setSheet('task')} onAddExpense={() => setSheet('expense')} /> : null}

            <TodayTasks data={d} onAdd={() => setSheet('task')} />
            <Animated.View entering={enterCard(4)}>
              <MoneyCard data={d} today={today} />
            </Animated.View>
            <UpcomingBills data={d} onPay={setPaying} />
            <Groceries data={d} />
          </>
        ) : null}
      </Screen>
      <QuickAddTaskSheet visible={sheet === 'task'} onClose={() => setSheet(null)} />
      <AddExpenseSheet visible={sheet === 'expense'} onClose={() => setSheet(null)} />
      <PayBillSheet bill={paying} onClose={() => setPaying(null)} />
    </>
  );
}

const isBrandNew = (d: Dashboard) =>
  d.tasks.items.length === 0 &&
  d.tasks.completedTodayCount === 0 &&
  d.spending.total === 0 &&
  !d.spending.overallBudget &&
  d.bills.upcoming.length === 0 &&
  d.groceries.pendingCount === 0;

/** The hero: how today is going, in one ring and one sentence. */
function DayOverview({ data }: { data: Dashboard }) {
  const t = useTheme();
  const styles = useStyles();
  const { overdueCount, dueTodayCount, completedTodayCount } = data.tasks;
  const total = dueTodayCount + overdueCount + completedTodayCount;
  const ratio = total > 0 ? completedTodayCount / total : 0;
  const left = dueTodayCount + overdueCount;

  const headline =
    total === 0
      ? 'A clear day'
      : left === 0
        ? 'All done for today'
        : `${left} task${left === 1 ? '' : 's'} left today`;
  const support =
    total === 0
      ? 'Nothing is due. Add something, or simply enjoy it.'
      : left === 0
        ? 'Lovely work. Everything due today is complete.'
        : overdueCount > 0
          ? `Including ${overdueCount} from earlier. One step at a time.`
          : `${completedTodayCount} of ${total} done so far.`;

  return (
    <Card tone="tinted" style={styles.hero}>
      <ProgressRing
        value={ratio}
        size={84}
        stroke={9}
        color={t.colors.primary}
        trackColor={t.scheme === 'light' ? '#FFFFFF' : t.colors.surfaceMuted}
        accessibilityLabel={`${completedTodayCount} of ${total} tasks done today`}>
        <Text variant="cardTitle" tone="primaryStrong">
          {total === 0 ? '—' : `${completedTodayCount}/${total}`}
        </Text>
      </ProgressRing>
      <View style={styles.flex}>
        <Text variant="headline" tone="primaryStrong">
          {headline}
        </Text>
        <Text variant="callout" tone="textSecondary" style={styles.heroSupport}>
          {support}
        </Text>
      </View>
    </Card>
  );
}

function TodayTasks({ data, onAdd }: { data: Dashboard; onAdd: () => void }) {
  const styles = useStyles();
  const { onToggle, onOpen } = useTaskActions();
  const items = data.tasks.items;
  return (
    <Animated.View entering={enterCard(3)}>
      <SectionHeader title="Today’s tasks" actionLabel="See all" onAction={() => router.push('/tasks')} />
      <Card padded={false}>
        {items.length === 0 ? (
          <Pressable style={styles.inlineEmpty} onPress={onAdd} accessibilityRole="button" accessibilityLabel="Add a task for today">
            <Icon name="plus-circle" size={20} tone="primary" />
            <Text variant="callout" tone="textSecondary" style={styles.flex}>
              Nothing due today. Tap to plan something.
            </Text>
          </Pressable>
        ) : (
          <View style={styles.cardInner}>
            {items.map((task, i) => (
              <View key={task.id}>
                {i > 0 ? <Divider inset={38} /> : null}
                <TaskRow task={task} onToggle={onToggle} onPress={onOpen} />
              </View>
            ))}
          </View>
        )}
      </Card>
    </Animated.View>
  );
}

function MoneyCard({ data, today }: { data: Dashboard; today: string }) {
  const t = useTheme();
  const styles = useStyles();
  const { spending } = data;
  const budget = spending.overallBudget;
  const color = useStateColor(budget?.state ?? 'neutral');
  const { y, m, d } = parseParts(today);
  const daysLeft = daysInMonth(y, m) - d + 1;

  return (
    <>
      <SectionHeader title="Spending" actionLabel="Details" onAction={() => router.push('/money')} />
      {/* Not pressable as a whole: it contains its own action, and nested buttons
          are unreachable for screen readers. "Details" above opens Money. */}
      <Card>
        <Text variant="label" tone="textSecondary">
          {formatMonth(spending.month)}
        </Text>
        <AnimatedAmount value={spending.total} variant="amountXL" style={styles.amount} />
        {budget ? (
          <View style={styles.budget}>
            <ProgressBar value={budget.ratio} color={color} accessibilityLabel="Monthly budget used" />
            <View style={styles.budgetRow}>
              <Text variant="caption" tone={budget.state === 'over' ? 'dangerText' : budget.state === 'warning' ? 'warningText' : 'textSecondary'} style={styles.flex}>
                {budgetHeadline(budget, daysLeft)}
              </Text>
              <Text variant="amountSmall" tone="textTertiary">
                of {formatMoney(budget.limit)}
              </Text>
            </View>
          </View>
        ) : (
          <Pressable
            style={styles.setBudget}
            onPress={() => router.push({ pathname: '/budget', params: { month: spending.month } })}
            accessibilityRole="button"
            accessibilityLabel="Set a monthly budget">
            <Icon name="target" size={16} tone="primary" />
            <Text variant="label" tone="primary">
              Set a monthly budget
            </Text>
          </Pressable>
        )}
        {spending.topCategories.length > 0 ? (
          <View style={styles.categories}>
            {spending.topCategories.map((c) => (
              <View key={c.category} style={styles.catChip}>
                <View style={[styles.dot, { backgroundColor: CATEGORY_META[c.category].color }]} />
                <Text variant="label" tone="textSecondary">
                  {CATEGORY_META[c.category].label}
                </Text>
                <Text variant="amountSmall">{formatMoney(c.total)}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {spending.categoryWarnings.length > 0 ? (
          <View style={[styles.warning, { backgroundColor: spending.categoryWarnings.some((w) => w.state === 'over') ? t.colors.dangerSoft : t.colors.warningSoft }]}>
            <Icon name="info" size={14} tone={spending.categoryWarnings.some((w) => w.state === 'over') ? 'dangerText' : 'warningText'} />
            <Text variant="caption" tone={spending.categoryWarnings.some((w) => w.state === 'over') ? 'dangerText' : 'warningText'} style={styles.flex}>
              {spending.categoryWarnings.map((w) => categoryWarning(w.category, w)).join(' · ')}
            </Text>
          </View>
        ) : null}
      </Card>
    </>
  );
}

function UpcomingBills({ data, onPay }: { data: Dashboard; onPay: (bill: Bill) => void }) {
  const styles = useStyles();
  const { bills } = data;
  if (bills.upcoming.length === 0) return null;
  return (
    <Animated.View entering={enterCard(5)}>
      <SectionHeader
        title="Upcoming bills"
        meta={bills.overdueCount ? `${bills.overdueCount} overdue` : undefined}
        actionLabel="See all"
        onAction={() => router.push('/bills')}
      />
      <Card padded={false}>
        <View style={styles.cardInner}>
          {bills.upcoming.map((bill, i) => (
            <View key={bill.id}>
              {i > 0 ? <Divider inset={50} /> : null}
              <BillRow bill={bill} compact onPay={onPay} onPress={(b) => router.push({ pathname: '/bill-editor', params: { id: b.id } })} />
            </View>
          ))}
        </View>
      </Card>
    </Animated.View>
  );
}

function Groceries({ data }: { data: Dashboard }) {
  const styles = useStyles();
  const { groceries } = data;
  if (groceries.pendingCount === 0) return null;
  const first = groceries.lists[0];
  return (
    <Animated.View entering={enterCard(6)}>
      <SectionHeader title="To buy" meta={`${groceries.pendingCount} item${groceries.pendingCount === 1 ? '' : 's'}`} actionLabel="Lists" onAction={() => router.push('/lists')} />
      <Card
        onPress={() => (first ? router.push({ pathname: '/grocery/[id]', params: { id: first.id } }) : router.push('/lists'))}
        accessibilityLabel={`${groceries.pendingCount} grocery items to buy`}
        accessibilityHint="Opens your grocery list">
        <View style={styles.previewWrap}>
          {groceries.preview.map((item) => (
            <Pill key={item.id} label={item.quantity !== 1 || item.unit ? `${item.name} · ${item.quantity}${item.unit ? ` ${item.unit}` : ''}` : item.name} />
          ))}
        </View>
        {groceries.lists.length > 0 ? (
          <Text variant="caption" tone="textSecondary" style={styles.listsLine}>
            {groceries.lists.map((l) => `${l.name} (${l.pendingItems})`).join(' · ')}
          </Text>
        ) : null}
      </Card>
    </Animated.View>
  );
}

function GettingStarted({ onAddTask, onAddExpense }: { onAddTask: () => void; onAddExpense: () => void }) {
  const styles = useStyles();
  const steps = [
    { icon: 'compass' as const, label: 'Take a 1-minute tour', onPress: () => router.push('/welcome-tour') },
    { icon: 'check-circle' as const, label: 'Add your first task', onPress: onAddTask },
    { icon: 'target' as const, label: 'Set a monthly budget', onPress: () => router.push('/budget') },
    { icon: 'credit-card' as const, label: 'Log today’s spending', onPress: onAddExpense },
    { icon: 'calendar' as const, label: 'Add a recurring bill', onPress: () => router.push('/bill-editor') },
  ];
  return (
    <Animated.View entering={enterCard(3)}>
      <SectionHeader title="Let’s set up your day" />
      <Card padded={false}>
        {steps.map((s, i) => (
          <View key={s.label}>
            {i > 0 ? <Divider inset={56} /> : null}
            <Pressable style={styles.step} onPress={s.onPress} accessibilityRole="button" accessibilityLabel={s.label}>
              <View style={styles.stepIcon}>
                <Icon name={s.icon} size={18} tone="primary" />
              </View>
              <Text variant="bodyMedium" style={styles.flex}>
                {s.label}
              </Text>
              <Icon name="chevron-right" size={18} tone="textTertiary" />
            </Pressable>
          </View>
        ))}
      </Card>
    </Animated.View>
  );
}

function DashboardSkeleton() {
  const styles = useStyles();
  return (
    <View accessibilityLabel="Loading your day" style={styles.skeleton}>
      <Skeleton height={116} radius={20} />
      <Skeleton height={86} radius={20} />
      <Skeleton width="40%" height={18} />
      <Skeleton height={180} radius={20} />
      <Skeleton height={150} radius={20} />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space.md, paddingTop: t.space.lg, paddingBottom: t.space.xl },
  greeting: { marginTop: t.space.xs },
  hero: { flexDirection: 'row', alignItems: 'center', gap: t.space.xl, padding: t.space.xl },
  heroSupport: { marginTop: t.space.xs },
  quick: { marginTop: t.space.lg },
  cardInner: { paddingHorizontal: t.space.lg },
  inlineEmpty: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, padding: t.space.lg, minHeight: 60 },
  amount: { marginTop: t.space.xs },
  budget: { marginTop: t.space.lg, gap: t.space.sm },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  setBudget: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm, marginTop: t.space.md, paddingVertical: t.space.xs },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.lg, marginTop: t.space.lg },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs + 2 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  warning: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm, marginTop: t.space.lg, padding: t.space.md, borderRadius: t.radius.sm },
  previewWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm },
  listsLine: { marginTop: t.space.md },
  step: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingHorizontal: t.space.lg, paddingVertical: t.space.md, minHeight: 56 },
  stepIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: t.colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  skeleton: { gap: t.space.lg },
}));

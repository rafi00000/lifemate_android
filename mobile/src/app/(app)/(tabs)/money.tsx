import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { DailyBars } from '@/components/charts/daily-bars';
import { DonutChart } from '@/components/charts/donut-chart';
import { Skeleton, SkeletonList } from '@/components/feedback/skeleton';
import { EmptyState, ErrorState } from '@/components/feedback/states';
import { PageTitle, SectionHeader } from '@/components/layout/headers';
import { Screen } from '@/components/layout/screen';
import { AnimatedAmount } from '@/components/ui/animated-amount';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { Icon } from '@/components/ui/icon';
import { Divider, Pill } from '@/components/ui/misc';
import { ProgressBar, useStateColor } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { CATEGORY_META } from '@/constants/categories';
import { AddExpenseSheet } from '@/features/money/add-expense-sheet';
import { useMonthExpenses, useMonthSummary } from '@/features/money/api';
import { budgetHeadline } from '@/features/money/budget-copy';
import { ExpenseRow } from '@/features/money/expense-row';
import { groupByDay } from '@/features/money/group-by-day';
import { MonthSwitcher } from '@/features/money/month-switcher';
import { useToday } from '@/hooks/use-today';
import { errorMessage } from '@/services/api/errors';
import { enterCard, makeStyles } from '@/theme';
import type { BudgetStatus, MonthSummary } from '@/types/api';
import { daysInMonth, formatMonth, monthKey, parseParts, relativeDayLabel } from '@/utils/date';
import { formatMoney, percentOf } from '@/utils/money';

const RECENT_LIMIT = 12;

export default function MoneyScreen() {
  const styles = useStyles();
  const today = useToday();
  const currentMonth = monthKey(today);
  const [month, setMonth] = useState(currentMonth);
  const [adding, setAdding] = useState(false);
  const summary = useMonthSummary(month);
  const expenses = useMonthExpenses(month);

  const list = useMemo(() => expenses.data?.pages.flatMap((p) => p.data) ?? [], [expenses.data]);
  const recent = useMemo(() => groupByDay(list.slice(0, RECENT_LIMIT)), [list]);
  const s = summary.data;

  return (
    <>
      <Screen withTabBar withFab onRefresh={() => Promise.all([summary.refetch(), expenses.refetch()])}>
        <PageTitle title="Money" subtitle="Spending and budgets" />
        <MonthSwitcher month={month} onChange={setMonth} maxMonth={currentMonth} />

        <View style={styles.content}>
          {summary.isPending ? (
            <View style={styles.skeleton}>
              <Skeleton height={170} radius={20} />
              <Skeleton height={260} radius={20} />
            </View>
          ) : summary.isError && !s ? (
            <ErrorState message={errorMessage(summary.error)} onRetry={() => void summary.refetch()} />
          ) : s ? (
            <>
              <Animated.View entering={enterCard(0)}>
                <SummaryCard summary={s} month={month} today={today} />
              </Animated.View>

              {s.total > 0 ? (
                <>
                  <Animated.View entering={enterCard(1)}>
                    <SectionHeader title="Where it went" />
                    <BreakdownCard summary={s} />
                  </Animated.View>
                  <Animated.View entering={enterCard(2)}>
                    <SectionHeader title="Day by day" />
                    <Card>
                      <DailyBars month={month} daily={s.daily} today={today} />
                    </Card>
                  </Animated.View>
                </>
              ) : null}

              <Animated.View entering={enterCard(3)}>
                <SectionHeader
                  title="Recent expenses"
                  meta={s.count ? String(s.count) : undefined}
                  actionLabel={s.count > RECENT_LIMIT ? 'View all' : undefined}
                  onAction={() => router.push({ pathname: '/expenses', params: { month } })}
                />
                {expenses.isPending ? (
                  <Card>
                    <SkeletonList count={3} />
                  </Card>
                ) : recent.length === 0 ? (
                  <Card>
                    <EmptyState
                      compact
                      icon="credit-card"
                      title={month === currentMonth ? 'No expenses yet this month' : `No expenses in ${formatMonth(month)}`}
                      message="Log what you spend to see where your money goes."
                      actionLabel={month === currentMonth ? 'Add expense' : undefined}
                      onAction={() => setAdding(true)}
                    />
                  </Card>
                ) : (
                  recent.map((group) => (
                    <View key={group.date} style={styles.dayGroup}>
                      <View style={styles.dayHeader}>
                        <Text variant="overline" tone="textSecondary">
                          {relativeDayLabel(group.date, today)}
                        </Text>
                        <Text variant="amountSmall" tone="textSecondary">
                          {formatMoney(group.total)}
                        </Text>
                      </View>
                      <Card padded={false}>
                        <View style={styles.cardInner}>
                          {group.items.map((e, i) => (
                            <View key={e.id}>
                              {i > 0 ? <Divider inset={52} /> : null}
                              <ExpenseRow expense={e} onPress={(x) => router.push({ pathname: '/expense-editor', params: { id: x.id, month } })} />
                            </View>
                          ))}
                        </View>
                      </Card>
                    </View>
                  ))
                )}
              </Animated.View>
            </>
          ) : null}
        </View>
      </Screen>
      {month === currentMonth ? <Fab label="Add expense" onPress={() => setAdding(true)} testID="money-fab" /> : null}
      <AddExpenseSheet visible={adding} onClose={() => setAdding(false)} />
    </>
  );
}

function SummaryCard({ summary, month, today }: { summary: MonthSummary; month: string; today: string }) {
  const styles = useStyles();
  const overall = summary.budget.overall;
  const color = useStateColor(overall?.state ?? 'neutral');
  const isCurrent = month === monthKey(today);
  const { y, m } = parseParts(`${month}-01`);
  const daysLeft = isCurrent ? daysInMonth(y, m) - parseParts(today).d + 1 : 0;

  return (
    <Card>
      <View style={styles.summaryTop}>
        <View style={styles.flex}>
          <Text variant="label" tone="textSecondary">
            {isCurrent ? 'Spent so far' : 'Total spent'}
          </Text>
          <AnimatedAmount value={summary.total} variant="amountXL" style={styles.amount} />
          <Text variant="caption" tone="textSecondary">
            {summary.count} expense{summary.count === 1 ? '' : 's'}
          </Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: '/budget', params: { month } })}
          accessibilityRole="button"
          accessibilityLabel={overall ? 'Edit budgets' : 'Set a budget'}
          hitSlop={8}
          style={styles.budgetLink}>
          <Icon name="target" size={15} tone="primary" />
          <Text variant="label" tone="primary">
            {overall ? 'Budgets' : 'Set budget'}
          </Text>
        </Pressable>
      </View>
      {overall ? (
        <View style={styles.budget}>
          <ProgressBar value={overall.ratio} color={color} height={10} accessibilityLabel="Monthly budget used" />
          <View style={styles.budgetRow}>
            <Text variant="caption" tone={overall.state === 'over' ? 'dangerText' : overall.state === 'warning' ? 'warningText' : 'textSecondary'} style={styles.flex}>
              {isCurrent ? budgetHeadline(overall, daysLeft) : overall.state === 'over' ? `Over by ${formatMoney(-overall.remaining)}` : `${formatMoney(overall.remaining)} under budget`}
            </Text>
            <Text variant="amountSmall" tone="textTertiary">
              {percentOf(overall.spent, overall.limit)}% of {formatMoney(overall.limit)}
            </Text>
          </View>
          {summary.budget.plan.inherited && summary.budget.plan.sourceMonth ? (
            <Text variant="caption" tone="textTertiary">
              Using your budget from {formatMonth(summary.budget.plan.sourceMonth)}.
            </Text>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function BreakdownCard({ summary }: { summary: MonthSummary }) {
  const styles = useStyles();
  const budgets = new Map<string, BudgetStatus>(summary.budget.categories.map((c) => [c.category, c]));
  const top = summary.byCategory[0];

  return (
    <Card>
      <View style={styles.donutWrap}>
        <DonutChart
          segments={summary.byCategory.map((c) => ({ key: c.category, value: c.total, color: CATEGORY_META[c.category].color }))}
          accessibilityLabel={`Spending by category. ${summary.byCategory
            .map((c) => `${CATEGORY_META[c.category].label} ${percentOf(c.total, summary.total)} percent`)
            .join(', ')}`}>
          <Text variant="label" tone="textSecondary">
            Top
          </Text>
          {top ? (
            <>
              <Text variant="cardTitle">{CATEGORY_META[top.category].label}</Text>
              <Text variant="caption" tone="textSecondary">
                {percentOf(top.total, summary.total)}%
              </Text>
            </>
          ) : null}
        </DonutChart>
      </View>
      <View style={styles.legend}>
        {summary.byCategory.map((c) => {
          const meta = CATEGORY_META[c.category];
          const budget = budgets.get(c.category);
          return (
            <View key={c.category} style={styles.legendRow}>
              <View style={styles.legendTop}>
                <View style={[styles.dot, { backgroundColor: meta.color }]} />
                <Text variant="bodyMedium" style={styles.flex}>
                  {meta.label}
                </Text>
                <Text variant="caption" tone="textTertiary">
                  {percentOf(c.total, summary.total)}%
                </Text>
                <Text variant="amount" style={styles.legendAmount}>
                  {formatMoney(c.total)}
                </Text>
              </View>
              {budget ? <CategoryBudgetLine status={budget} /> : null}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

function CategoryBudgetLine({ status }: { status: BudgetStatus }) {
  const styles = useStyles();
  const color = useStateColor(status.state);
  return (
    <View style={styles.catBudget}>
      <ProgressBar value={status.ratio} color={color} height={6} style={styles.flex} />
      {status.state === 'ok' ? (
        <Text variant="label" tone="textTertiary">
          {formatMoney(status.remaining)} left
        </Text>
      ) : (
        <Pill
          label={status.state === 'over' ? `${formatMoney(-status.remaining)} over` : `${percentOf(status.spent, status.limit)}% used`}
          tone={status.state === 'over' ? 'danger' : 'warning'}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  content: { marginTop: t.space.xl },
  skeleton: { gap: t.space.lg },
  summaryTop: { flexDirection: 'row', alignItems: 'flex-start', gap: t.space.md },
  amount: { marginVertical: t.space.xs },
  budgetLink: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs, paddingVertical: t.space.xs },
  budget: { marginTop: t.space.lg, gap: t.space.sm },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  donutWrap: { alignItems: 'center', paddingVertical: t.space.sm },
  legend: { marginTop: t.space.xl, gap: t.space.lg },
  legendRow: { gap: t.space.sm },
  legendTop: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  legendAmount: { minWidth: 84, textAlign: 'right' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catBudget: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingLeft: 22 },
  dayGroup: { marginBottom: t.space.lg },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: t.space.sm, paddingHorizontal: t.space.xs },
  cardInner: { paddingHorizontal: t.space.lg },
}));

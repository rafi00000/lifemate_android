import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SkeletonList } from '@/components/feedback/skeleton';
import { EmptyState, ErrorState } from '@/components/feedback/states';
import { StackHeader } from '@/components/layout/headers';
import { Text } from '@/components/ui/text';
import { useMonthExpenses } from '@/features/money/api';
import { ExpenseRow } from '@/features/money/expense-row';
import { groupByDay } from '@/features/money/group-by-day';
import { errorMessage } from '@/services/api/errors';
import { makeStyles, useTheme } from '@/theme';
import { formatMonth, formatShortDate, monthKey, todayString } from '@/utils/date';
import { formatMoney } from '@/utils/money';

/** Every expense in a month, grouped by day, loading more as you scroll. */
export default function ExpensesScreen() {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { month = monthKey(todayString()) } = useLocalSearchParams<{ month?: string }>();
  const q = useMonthExpenses(month);

  const sections = useMemo(
    () => groupByDay(q.data?.pages.flatMap((p) => p.data) ?? []).map((g) => ({ ...g, data: g.items })),
    [q.data],
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StackHeader title={formatMonth(month)} />
      {q.isPending ? (
        <View style={styles.pad}>
          <SkeletonList count={8} />
        </View>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(e) => e.id}
          contentContainerStyle={[styles.pad, { paddingBottom: insets.bottom + 24 }]}
          stickySectionHeadersEnabled={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
          }}
          refreshing={q.isRefetching && !q.isFetchingNextPage}
          onRefresh={() => void q.refetch()}
          renderSectionHeader={({ section }) => (
            <View style={styles.header}>
              <Text variant="overline" tone="textSecondary">
                {formatShortDate(section.date)}
              </Text>
              <Text variant="amountSmall" tone="textSecondary">
                {formatMoney(section.total)}
              </Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={styles.item}>
              <ExpenseRow expense={item} onPress={(e) => router.push({ pathname: '/expense-editor', params: { id: e.id, month } })} />
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="credit-card" title="No expenses this month" />}
          ListFooterComponent={q.isFetchingNextPage ? <ActivityIndicator color={t.colors.primary} style={styles.footer} /> : null}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  root: { flex: 1, backgroundColor: t.colors.background },
  pad: { paddingHorizontal: t.gutter },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: t.space.xl, paddingBottom: t.space.xs, paddingHorizontal: t.space.xs },
  item: { backgroundColor: t.colors.surface, paddingHorizontal: t.space.lg, borderRadius: t.radius.md, marginTop: t.space.xs },
  footer: { paddingVertical: t.space.xl },
}));

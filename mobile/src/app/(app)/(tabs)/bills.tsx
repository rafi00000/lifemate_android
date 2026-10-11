import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { SkeletonList } from '@/components/feedback/skeleton';
import { EmptyState, ErrorState } from '@/components/feedback/states';
import { PageTitle } from '@/components/layout/headers';
import { Screen } from '@/components/layout/screen';
import { AnimatedAmount } from '@/components/ui/animated-amount';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { Icon } from '@/components/ui/icon';
import { Divider } from '@/components/ui/misc';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Text } from '@/components/ui/text';
import { useBills } from '@/features/bills/api';
import { BillRow } from '@/features/bills/bill-row';
import { PayBillSheet } from '@/features/bills/pay-bill-sheet';
import { sectionBills } from '@/features/bills/sections';
import { useToday } from '@/hooks/use-today';
import { errorMessage } from '@/services/api/errors';
import { enterCard, makeStyles } from '@/theme';
import type { Bill } from '@/types/api';
import { diffDays } from '@/utils/date';
import { formatMoney } from '@/utils/money';

type View_ = 'upcoming' | 'paid';

export default function BillsScreen() {
  const styles = useStyles();
  const today = useToday();
  const [view, setView] = useState<View_>('upcoming');
  const [paying, setPaying] = useState<Bill | null>(null);
  const unpaid = useBills('unpaid');
  const paid = useBills('paid', view === 'paid');

  const sections = useMemo(() => sectionBills(unpaid.data ?? [], today), [unpaid.data, today]);
  const next30 = useMemo(
    () => (unpaid.data ?? []).filter((b) => diffDays(today, b.dueDate) <= 30),
    [unpaid.data, today],
  );
  const overdueCount = sections.find((s) => s.key === 'overdue')?.bills.length ?? 0;
  const open = (b: Bill) => router.push({ pathname: '/bill-editor', params: { id: b.id } });
  const active = view === 'upcoming' ? unpaid : paid;

  return (
    <>
      <Screen withTabBar withFab onRefresh={() => Promise.all([unpaid.refetch(), view === 'paid' ? paid.refetch() : null])}>
        <PageTitle title="Bills" subtitle="Subscriptions and due dates" />

        {unpaid.data && unpaid.data.length > 0 ? (
          <Animated.View entering={enterCard(0)}>
            <Card tone="tinted" style={styles.summary}>
              <View style={styles.flex}>
                <Text variant="label" tone="textSecondary">
                  Due in the next 30 days
                </Text>
                <AnimatedAmount value={next30.reduce((s, b) => s + b.amount, 0)} variant="amountL" tone="primaryStrong" />
                <Text variant="caption" tone="textSecondary">
                  {next30.length} bill{next30.length === 1 ? '' : 's'}
                </Text>
              </View>
              {overdueCount > 0 ? (
                <View style={styles.overdue}>
                  <Icon name="alert-circle" size={16} tone="dangerText" />
                  <Text variant="label" tone="dangerText">
                    {overdueCount} overdue
                  </Text>
                </View>
              ) : null}
            </Card>
          </Animated.View>
        ) : null}

        <View style={styles.segment}>
          <SegmentedControl<View_>
            value={view}
            onChange={setView}
            accessibilityLabel="Bill filter"
            options={[
              { value: 'upcoming', label: 'Upcoming', count: unpaid.data?.length },
              { value: 'paid', label: 'Paid one-offs' },
            ]}
          />
        </View>

        {active.isPending ? (
          <Card>
            <SkeletonList count={4} />
          </Card>
        ) : active.isError ? (
          <ErrorState message={errorMessage(active.error)} onRetry={() => void active.refetch()} />
        ) : view === 'paid' ? (
          (paid.data ?? []).length === 0 ? (
            <EmptyState icon="check-square" title="No paid one-off bills" message="Recurring bills move to their next date when paid, so they stay in Upcoming." />
          ) : (
            <Card padded={false}>
              <View style={styles.inner}>
                {paid.data!.map((b, i) => (
                  <View key={b.id}>
                    {i > 0 ? <Divider inset={54} /> : null}
                    <BillRow bill={b} onPress={open} />
                  </View>
                ))}
              </View>
            </Card>
          )
        ) : sections.length === 0 ? (
          <EmptyState
            icon="calendar"
            title="No bills yet"
            message="Add rent, internet, electricity or subscriptions and we’ll remind you before they’re due."
            actionLabel="Add a bill"
            onAction={() => router.push('/bill-editor')}
          />
        ) : (
          sections.map((section, si) => (
            <Animated.View key={section.key} entering={enterCard(si + 1)} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="overline" tone={section.tone === 'danger' ? 'dangerText' : 'textSecondary'}>
                  {section.title}
                </Text>
                <Text variant="amountSmall" tone="textSecondary">
                  {formatMoney(section.bills.reduce((s, b) => s + b.amount, 0))}
                </Text>
              </View>
              <Card padded={false}>
                <View style={styles.inner}>
                  {section.bills.map((b, i) => (
                    <View key={b.id}>
                      {i > 0 ? <Divider inset={54} /> : null}
                      <BillRow bill={b} onPress={open} onPay={setPaying} />
                    </View>
                  ))}
                </View>
              </Card>
            </Animated.View>
          ))
        )}
      </Screen>
      <Fab label="Add bill" onPress={() => router.push('/bill-editor')} testID="bills-fab" />
      <PayBillSheet bill={paying} onClose={() => setPaying(null)} />
    </>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1, gap: 2 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  overdue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.xs,
    paddingHorizontal: t.space.md,
    paddingVertical: t.space.sm,
    borderRadius: t.radius.pill,
    backgroundColor: t.colors.dangerSoft,
  },
  segment: { marginTop: t.space.xl, marginBottom: t.space.xl },
  section: { marginBottom: t.space.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: t.space.sm, paddingHorizontal: t.space.xs },
  inner: { paddingHorizontal: t.space.lg },
}));

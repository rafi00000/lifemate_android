import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { DonutChart } from '@/components/charts/donut-chart';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@/components/ui/icon';
import { IconBadge, Pill } from '@/components/ui/misc';
import { ProgressBar, ProgressRing } from '@/components/ui/progress';
import { Text } from '@/components/ui/text';
import { CATEGORY_META } from '@/constants/categories';
import { makeStyles, useTheme } from '@/theme';
import { formatMoney } from '@/utils/money';
import { CORE_FEATURES, type CoreFeatureId } from './content';

/**
 * Small, live previews of each feature built from the real components, so
 * the tour shows exactly what users will meet in the app. Tasks and
 * groceries are interactive: users can try ticking items.
 */
export function FeaturePreview({ id }: { id: CoreFeatureId | 'intro' | 'done' }) {
  switch (id) {
    case 'intro':
      return <IntroPreview />;
    case 'today':
      return <TodayPreview />;
    case 'tasks':
      return <TasksPreview />;
    case 'money':
      return <MoneyPreview />;
    case 'bills':
      return <BillsPreview />;
    case 'lists':
      return <ListsPreview />;
    case 'done':
      return <DonePreview />;
  }
}

function Frame({ children, hint }: { children: ReactNode; hint?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.frame} accessibilityElementsHidden={!hint} importantForAccessibility={hint ? 'auto' : 'no-hide-descendants'}>
      {children}
      {hint ? (
        <View style={styles.hint}>
          <Icon name="mouse-pointer" size={13} tone="primary" />
          <Text variant="label" tone="primary">
            {hint}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function IntroPreview() {
  const styles = useStyles();
  return (
    <View style={styles.grid} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {CORE_FEATURES.map((f) => (
        <View key={f.id} style={styles.gridItem}>
          <View style={styles.gridIcon}>
            <Icon name={f.icon} size={22} tone="primaryStrong" />
          </View>
          <Text variant="label" tone="textSecondary">
            {f.tab}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TodayPreview() {
  const t = useTheme();
  const styles = useStyles();
  return (
    <Frame>
      <View style={styles.row}>
        <ProgressRing value={0.6} size={68} stroke={8} trackColor={t.colors.surfaceMuted}>
          <Text variant="cardTitle" tone="primaryStrong">
            3/5
          </Text>
        </ProgressRing>
        <View style={styles.flex}>
          <Text variant="cardTitle">2 tasks left today</Text>
          <Text variant="caption" tone="textSecondary">
            One step at a time.
          </Text>
        </View>
      </View>
      <View style={styles.divider} />
      <Text variant="label" tone="textSecondary">
        October spending
      </Text>
      <Text variant="amountL">{formatMoney(1_245_000)}</Text>
      <ProgressBar value={0.62} style={styles.barGap} />
      <Text variant="caption" tone="textSecondary" style={styles.barGap}>
        {formatMoney(755_000)} left · {formatMoney(37_700)}/day
      </Text>
    </Frame>
  );
}

const SAMPLE_TASKS = [
  { id: 'a', title: 'Morning walk', meta: 'Done', priority: 'low' },
  { id: 'b', title: 'Submit SDP report', meta: '5:00 PM · reminder', priority: 'high' },
  { id: 'c', title: 'Call Ammu', meta: '8:30 PM', priority: 'medium' },
] as const;

function TasksPreview() {
  const t = useTheme();
  const styles = useStyles();
  const [done, setDone] = useState<Record<string, boolean>>({ a: true });
  const ring = { high: t.colors.danger, medium: t.colors.warning, low: t.colors.borderStrong };
  return (
    <Frame hint="Try it: tap a circle">
      {SAMPLE_TASKS.map((task) => (
        <View key={task.id} style={styles.listRow}>
          <Checkbox
            checked={!!done[task.id]}
            onToggle={() => setDone((d) => ({ ...d, [task.id]: !d[task.id] }))}
            ringColor={ring[task.priority]}
            label={`Sample task: ${task.title}`}
            size={24}
          />
          <View style={styles.flex}>
            <Text variant="bodyMedium" tone={done[task.id] ? 'textTertiary' : 'text'} style={done[task.id] && styles.strike}>
              {task.title}
            </Text>
            <Text variant="caption" tone="textSecondary">
              {task.meta}
            </Text>
          </View>
        </View>
      ))}
    </Frame>
  );
}

function MoneyPreview() {
  const styles = useStyles();
  const segments = (['housing', 'food', 'transport', 'entertainment'] as const).map((c, i) => ({
    key: c,
    value: [12_000, 4_460, 1_900, 1_250][i]!,
    color: CATEGORY_META[c].color,
  }));
  return (
    <Frame>
      <View style={styles.row}>
        <DonutChart segments={segments} size={92} stroke={12} accessibilityLabel="Sample spending chart" />
        <View style={styles.flex}>
          {segments.slice(0, 3).map((s) => (
            <View key={s.key} style={styles.legend}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text variant="caption" tone="textSecondary" style={styles.flex}>
                {CATEGORY_META[s.key].label}
              </Text>
              <Text variant="amountSmall">{formatMoney(s.value * 100)}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.alert}>
        <Icon name="alert-triangle" size={14} tone="warningText" />
        <Text variant="caption" tone="warningText" style={styles.flex}>
          85% of your monthly budget used · ৳3,750 left
        </Text>
      </View>
    </Frame>
  );
}

function BillsPreview() {
  const styles = useStyles();
  const bills = [
    { name: 'Internet (Link3)', due: 'Due in 3 days', amount: 120_000, urgent: false },
    { name: 'Electricity (DESCO)', due: '1 day overdue', amount: 185_000, urgent: true },
  ];
  return (
    <Frame>
      {bills.map((b) => (
        <View key={b.name} style={styles.listRow}>
          <IconBadge icon="zap" color={CATEGORY_META.bills.color} size={38} />
          <View style={styles.flex}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {b.name}
            </Text>
            <Text variant="caption" tone={b.urgent ? 'dangerText' : 'warningText'}>
              {b.due}
            </Text>
          </View>
          <Text variant="amount">{formatMoney(b.amount)}</Text>
          <View style={[styles.pay, b.urgent && styles.payUrgent]}>
            <Text variant="label" tone={b.urgent ? 'onPrimary' : 'primaryStrong'}>
              Pay
            </Text>
          </View>
        </View>
      ))}
    </Frame>
  );
}

function ListsPreview() {
  const styles = useStyles();
  const [bought, setBought] = useState<Record<string, boolean>>({ Onions: true });
  const items = [
    { name: 'Miniket rice', qty: '2 kg' },
    { name: 'Eggs', qty: '×12' },
    { name: 'Onions', qty: '1 kg' },
  ];
  return (
    <Frame hint="Try it: tick an item">
      <View style={styles.typed}>
        <Icon name="plus" size={15} tone="textTertiary" />
        <Text variant="callout" tone="textSecondary">
          “2 kg rice”
        </Text>
        <Icon name="arrow-right" size={14} tone="textTertiary" />
        <Pill label="Rice · 2 kg" tone="primary" />
      </View>
      {items.map((item) => (
        <View key={item.name} style={styles.listRow}>
          <Checkbox
            checked={!!bought[item.name]}
            onToggle={() => setBought((b) => ({ ...b, [item.name]: !b[item.name] }))}
            label={`Sample item: ${item.name}`}
            size={24}
          />
          <Text variant="bodyMedium" tone={bought[item.name] ? 'textTertiary' : 'text'} style={[styles.flex, bought[item.name] && styles.strike]}>
            {item.name}
          </Text>
          <Pill label={item.qty} />
        </View>
      ))}
    </Frame>
  );
}

function DonePreview() {
  const styles = useStyles();
  return (
    <View style={styles.done} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.doneHalo}>
        <View style={styles.doneBadge}>
          <Icon name="check" size={34} tone="onPrimary" />
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  flex: { flex: 1 },
  frame: {
    width: '100%',
    maxWidth: 360,
    alignSelf: 'center',
    gap: t.space.sm,
    padding: t.space.lg,
    borderRadius: t.radius.xl,
    backgroundColor: t.colors.surface,
    ...t.elevation.hairline,
    ...t.elevation.floating,
  },
  hint: { flexDirection: 'row', alignItems: 'center', gap: t.space.xs, alignSelf: 'center', marginTop: t.space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.lg },
  divider: { height: 1, backgroundColor: t.colors.border, marginVertical: t.space.sm },
  barGap: { marginTop: t.space.xs },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, minHeight: 48 },
  strike: { textDecorationLine: 'line-through' },
  legend: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm, paddingVertical: 3 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.sm,
    padding: t.space.md,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.warningSoft,
    marginTop: t.space.xs,
  },
  pay: { paddingHorizontal: t.space.md, paddingVertical: t.space.xs + 2, borderRadius: t.radius.pill, backgroundColor: t.colors.primarySoft },
  payUrgent: { backgroundColor: t.colors.primary },
  typed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.sm,
    padding: t.space.sm,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.surfaceMuted,
    marginBottom: t.space.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: t.space.lg, maxWidth: 340, alignSelf: 'center' },
  gridItem: { width: 88, alignItems: 'center', gap: t.space.sm },
  gridIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  done: { alignItems: 'center', justifyContent: 'center', paddingVertical: t.space.lg },
  doneHalo: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

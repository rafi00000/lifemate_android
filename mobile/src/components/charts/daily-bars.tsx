import { memo, useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { duration, easing, makeStyles, useTheme } from '@/theme';
import { daysInMonth, parseParts } from '@/utils/date';
import { formatMoney, formatMoneyCompact } from '@/utils/money';
import { Text } from '../ui/text';

interface DailyBarsProps {
  month: string; // YYYY-MM
  daily: { date: string; total: number }[];
  today: string;
  height?: number;
}

/**
 * Spending per day across the month. Bars grow up in a gentle left-to-right
 * wave; today is highlighted and future days stay as faint stubs so the
 * month's shape is clear at a glance.
 */
export function DailyBars({ month, daily, today, height = 96 }: DailyBarsProps) {
  const t = useTheme();
  const styles = useStyles();
  const [y, m] = month.split('-').map(Number) as [number, number];
  const days = daysInMonth(y, m);
  const totals = new Map(daily.map((d) => [parseParts(d.date).d, d.total]));
  const max = Math.max(1, ...daily.map((d) => d.total));
  const peak = daily.reduce((best, d) => (d.total > (best?.total ?? 0) ? d : best), undefined as (typeof daily)[number] | undefined);
  const todayDay = today.startsWith(month) ? parseParts(today).d : today > month ? days + 1 : 0;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        peak ? `Daily spending chart. Highest day: ${parseParts(peak.date).d} ${month}, ${formatMoney(peak.total)}.` : 'Daily spending chart, no spending yet.'
      }>
      <View style={styles.header}>
        <Text variant="label" tone="textSecondary">
          Peak {formatMoneyCompact(max)}
        </Text>
      </View>
      <View style={[styles.chart, { height }]}>
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const value = totals.get(day) ?? 0;
          return (
            <Bar
              key={day}
              index={i}
              ratio={value / max}
              height={height}
              color={day === todayDay ? t.colors.primary : value > 0 ? t.colors.secondary : t.colors.track}
              future={day > todayDay}
            />
          );
        })}
      </View>
      <View style={styles.axis}>
        <Text variant="label" tone="textTertiary">
          1
        </Text>
        <Text variant="label" tone="textTertiary">
          {Math.ceil(days / 2)}
        </Text>
        <Text variant="label" tone="textTertiary">
          {days}
        </Text>
      </View>
    </View>
  );
}

const Bar = memo(function Bar({ index, ratio, height, color, future }: { index: number; ratio: number; height: number; color: string; future: boolean }) {
  const styles = useStyles();
  const grow = useSharedValue(0);
  useEffect(() => {
    grow.value = withDelay(index * 12, withTiming(ratio, { duration: duration.progress, easing: easing.standard }));
  }, [ratio, index, grow]);
  const style = useAnimatedStyle(() => ({ height: Math.max(3, grow.value * height) }));
  return (
    <View style={styles.slot}>
      <Animated.View style={[styles.bar, { backgroundColor: color, opacity: future ? 0.5 : 1 }, style]} />
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  header: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: t.space.xs },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  slot: { flex: 1, justifyContent: 'flex-end', height: '100%' },
  bar: { width: '100%', borderRadius: 3 },
  axis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: t.space.xs },
}));

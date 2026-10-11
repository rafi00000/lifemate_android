import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { duration, makeStyles, useTheme } from '@/theme';
import { addDays, formatLongDate, formatMonth, monthGrid, monthKey, shiftMonth, todayString, WEEKDAYS_SHORT } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import { ChipGroup } from './chip';
import { IconButton } from './icon-button';
import { Text } from './text';

interface CalendarProps {
  value: string | null;
  onChange: (date: string) => void;
  /** Earliest selectable date (inclusive). */
  minDate?: string;
}

/**
 * Inline month calendar. Built in-house (rather than the platform dialog)
 * so it matches LifeMate's look, works the same on every Android version,
 * and stays fully keyboard/screen-reader labelled.
 */
export function Calendar({ value, onChange, minDate }: CalendarProps) {
  const t = useTheme();
  const styles = useStyles();
  const today = todayString();
  const [month, setMonth] = useState(monthKey(value ?? today));
  const days = useMemo(() => monthGrid(month, 6 /* Saturday: Bangladesh week */), [month]);
  const weekdayOrder = [6, 0, 1, 2, 3, 4, 5];

  return (
    <View style={styles.calendar}>
      <View style={styles.monthRow}>
        <IconButton icon="chevron-left" label="Previous month" size={36} onPress={() => setMonth(shiftMonth(month, -1))} />
        <Text variant="cardTitle" style={styles.monthLabel} accessibilityLiveRegion="polite">
          {formatMonth(month)}
        </Text>
        <IconButton icon="chevron-right" label="Next month" size={36} onPress={() => setMonth(shiftMonth(month, 1))} />
      </View>
      <View style={styles.weekRow}>
        {weekdayOrder.map((d) => (
          <Text key={d} variant="label" tone="textTertiary" style={styles.weekday}>
            {WEEKDAYS_SHORT[d]!.slice(0, 2)}
          </Text>
        ))}
      </View>
      <Animated.View key={month} entering={FadeIn.duration(duration.fast)} style={styles.grid}>
        {days.map((date) => {
          const inMonth = date.startsWith(month);
          const selected = date === value;
          const isToday = date === today;
          const disabled = !!minDate && date < minDate;
          return (
            <Pressable
              key={date}
              disabled={disabled}
              onPress={() => {
                haptics.selection();
                onChange(date);
              }}
              style={styles.cell}
              accessibilityRole="button"
              accessibilityLabel={formatLongDate(date)}
              accessibilityState={{ selected, disabled }}>
              <View style={[styles.day, selected && { backgroundColor: t.colors.primary }, !selected && isToday && styles.today]}>
                <Text
                  variant="callout"
                  color={selected ? t.colors.onPrimary : undefined}
                  tone={!inMonth || disabled ? 'textTertiary' : isToday ? 'primary' : 'text'}
                  style={[!inMonth && styles.faded, disabled && styles.faded]}>
                  {Number(date.slice(8))}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

type QuickDate = 'today' | 'tomorrow' | 'nextWeek' | 'none' | 'pick';

interface DueDateFieldProps {
  value: string | null;
  onChange: (date: string | null) => void;
  allowNone?: boolean;
}

/** Quick chips for the common cases, with the full calendar one tap away. */
export function DueDateField({ value, onChange, allowNone = true }: DueDateFieldProps) {
  const today = todayString();
  const quick: Record<Exclude<QuickDate, 'pick' | 'none'>, string> = {
    today,
    tomorrow: addDays(today, 1),
    nextWeek: addDays(today, 7),
  };
  const current: QuickDate =
    value === null ? 'none' : value === quick.today ? 'today' : value === quick.tomorrow ? 'tomorrow' : value === quick.nextWeek ? 'nextWeek' : 'pick';
  const [showCalendar, setShowCalendar] = useState(current === 'pick');

  const options = [
    { value: 'today' as const, label: 'Today', icon: 'sun' as const },
    { value: 'tomorrow' as const, label: 'Tomorrow', icon: 'sunrise' as const },
    { value: 'nextWeek' as const, label: 'Next week', icon: 'calendar' as const },
    { value: 'pick' as const, label: current === 'pick' && value ? value : 'Pick date', icon: 'more-horizontal' as const },
    ...(allowNone ? [{ value: 'none' as const, label: 'No date', icon: 'slash' as const }] : []),
  ];

  return (
    <View style={{ gap: 12 }}>
      <ChipGroup
        scroll
        accessibilityLabel="Due date"
        options={options}
        value={showCalendar ? 'pick' : current}
        onChange={(v) => {
          if (v === 'pick') {
            setShowCalendar(true);
            return;
          }
          setShowCalendar(false);
          onChange(v === 'none' ? null : quick[v]);
        }}
      />
      {showCalendar ? <Calendar value={value} onChange={onChange} /> : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  calendar: { backgroundColor: t.colors.surfaceMuted, borderRadius: t.radius.lg, padding: t.space.sm },
  monthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: t.space.xs },
  monthLabel: { flex: 1, textAlign: 'center' },
  weekRow: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', paddingVertical: t.space.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', maxHeight: 48 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: t.colors.primary },
  faded: { opacity: 0.45 },
}));

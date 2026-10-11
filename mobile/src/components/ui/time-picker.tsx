import { View } from 'react-native';
import { makeStyles } from '@/theme';
import { formatTime } from '@/utils/date';
import { haptics } from '@/utils/haptics';
import { ChipGroup } from './chip';
import { IconButton } from './icon-button';
import { Text } from './text';

const PRESETS = ['09:00', '12:00', '15:00', '18:00', '21:00'];
const pad = (n: number) => String(n).padStart(2, '0');

interface TimePickerProps {
  value: string | null;
  onChange: (time: string | null) => void;
}

/**
 * Presets cover most reminders in one tap; the stepper fine-tunes in
 * 1-hour / 5-minute steps with large, easy targets.
 */
export function TimePicker({ value, onChange }: TimePickerProps) {
  const styles = useStyles();
  const [h, m] = (value ?? '09:00').split(':').map(Number) as [number, number];

  const set = (hours: number, minutes: number) => {
    haptics.selection();
    onChange(`${pad((hours + 24) % 24)}:${pad((minutes + 60) % 60)}`);
  };

  return (
    <View style={styles.wrap}>
      <ChipGroup
        scroll
        accessibilityLabel="Time"
        value={value === null ? 'none' : PRESETS.includes(value) ? value : 'custom'}
        onChange={(v) => onChange(v === 'none' ? null : v === 'custom' ? (value ?? '09:00') : v)}
        options={[
          { value: 'none', label: 'Any time', icon: 'clock' },
          ...PRESETS.map((p) => ({ value: p, label: formatTime(p) })),
        ]}
      />
      {value ? (
        <View style={styles.stepper}>
          <View style={styles.unit}>
            <IconButton icon="minus" label="Earlier by an hour" variant="soft" size={36} onPress={() => set(h - 1, m)} />
            <Text variant="amountL" style={styles.value} accessibilityLabel={`Time ${formatTime(value)}`}>
              {formatTime(value)}
            </Text>
            <IconButton icon="plus" label="Later by an hour" variant="soft" size={36} onPress={() => set(h + 1, m)} />
          </View>
          <View style={styles.minutes}>
            <IconButton icon="chevron-left" label="5 minutes earlier" size={32} onPress={() => set(m - 5 < 0 ? h - 1 : h, m - 5)} />
            <Text variant="label" tone="textSecondary">
              5 min
            </Text>
            <IconButton icon="chevron-right" label="5 minutes later" size={32} onPress={() => set(m + 5 >= 60 ? h + 1 : h, m + 5)} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { gap: t.space.md },
  stepper: {
    backgroundColor: t.colors.surfaceMuted,
    borderRadius: t.radius.lg,
    padding: t.space.md,
    alignItems: 'center',
    gap: t.space.xs,
  },
  unit: { flexDirection: 'row', alignItems: 'center', gap: t.space.lg },
  value: { minWidth: 120, textAlign: 'center' },
  minutes: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
}));

import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  /** Optional accent (e.g. a category colour) shown as a dot or icon tint. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Chip({ label, selected = false, onPress, icon, accent, style, testID }: ChipProps) {
  const t = useTheme();
  const styles = useStyles();
  const fg = selected ? t.colors.onPrimary : t.colors.text;
  return (
    <PressableScale
      testID={testID}
      onPress={() => {
        haptics.selection();
        onPress?.();
      }}
      pressedScale={0.94}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.chip, selected ? styles.selected : styles.idle, style]}>
      {icon ? (
        <Icon name={icon} size={15} color={selected ? fg : (accent ?? t.colors.textSecondary)} />
      ) : accent ? (
        <View style={[styles.dot, { backgroundColor: selected ? fg : accent }]} />
      ) : null}
      <Text variant="label" color={fg} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

interface ChipOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
  accent?: string;
}

interface ChipGroupProps<T extends string> {
  options: ChipOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Horizontal scroll for long option sets; wrap otherwise. */
  scroll?: boolean;
  accessibilityLabel?: string;
}

export function ChipGroup<T extends string>({ options, value, onChange, scroll, accessibilityLabel }: ChipGroupProps<T>) {
  const styles = useStyles();
  const chips = options.map((o) => (
    <Chip key={o.value} label={o.label} icon={o.icon} accent={o.accent} selected={o.value === value} onPress={() => onChange(o.value)} />
  ));
  if (scroll) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        accessibilityLabel={accessibilityLabel}>
        {chips}
      </ScrollView>
    );
  }
  return (
    <View style={styles.wrap} accessibilityLabel={accessibilityLabel}>
      {chips}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.xs + 2,
    height: 36,
    paddingHorizontal: t.space.md + 2,
    borderRadius: t.radius.pill,
  },
  idle: { backgroundColor: t.colors.surfaceMuted },
  selected: { backgroundColor: t.colors.primary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  row: { gap: t.space.sm, paddingRight: t.space.lg },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: t.space.sm },
}));

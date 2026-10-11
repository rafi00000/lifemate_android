import { View } from 'react-native';
import { IconButton } from '@/components/ui/icon-button';
import { Text } from '@/components/ui/text';
import { makeStyles } from '@/theme';
import { formatMonth, shiftMonth } from '@/utils/date';

interface MonthSwitcherProps {
  month: string;
  onChange: (month: string) => void;
  /** Latest month that can be shown (the current one). */
  maxMonth: string;
}

export function MonthSwitcher({ month, onChange, maxMonth }: MonthSwitcherProps) {
  const styles = useStyles();
  const atMax = month >= maxMonth;
  return (
    <View style={styles.row}>
      <IconButton icon="chevron-left" label="Previous month" variant="soft" size={36} onPress={() => onChange(shiftMonth(month, -1))} />
      <Text variant="cardTitle" style={styles.label} accessibilityLiveRegion="polite">
        {formatMonth(month)}
      </Text>
      <IconButton
        icon="chevron-right"
        label="Next month"
        variant="soft"
        size={36}
        disabled={atMax}
        onPress={() => onChange(shiftMonth(month, 1))}
      />
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md },
  label: { flex: 1, textAlign: 'center' },
}));

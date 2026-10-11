import { View } from 'react-native';
import { Icon, type IconName } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';
import { makeStyles } from '@/theme';
import { haptics } from '@/utils/haptics';

interface QuickAction {
  key: string;
  label: string;
  icon: IconName;
  onPress: () => void;
}

/** One-tap entry points for the four most common captures. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      {actions.map((a) => (
        <PressableScale
          key={a.key}
          testID={`quick-${a.key}`}
          onPress={() => {
            haptics.light();
            a.onPress();
          }}
          pressedScale={0.93}
          accessibilityLabel={`Add ${a.label.toLowerCase()}`}
          style={styles.action}>
          <View style={styles.icon}>
            <Icon name={a.icon} size={20} tone="primaryStrong" />
          </View>
          <Text variant="label" tone="textSecondary" numberOfLines={1}>
            {a.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  row: { flexDirection: 'row', gap: t.space.sm },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: t.space.sm,
    paddingVertical: t.space.md,
    borderRadius: t.radius.lg,
    backgroundColor: t.colors.surface,
    ...t.elevation.hairline,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: t.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));

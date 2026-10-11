import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { duration, easing, makeStyles, TAB_BAR_HEIGHT } from '@/theme';
import { haptics } from '@/utils/haptics';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

interface FabProps {
  label: string;
  onPress: () => void;
  icon?: IconName;
  /** Show the label next to the icon (extended FAB). */
  extended?: boolean;
  testID?: string;
}

/** The screen's primary "add" action, floating above the tab bar. */
export function Fab({ label, onPress, icon = 'plus', extended = false, testID }: FabProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={ZoomIn.duration(duration.entrance).easing(easing.standard).delay(120)}
      style={[styles.wrap, { bottom: insets.bottom + TAB_BAR_HEIGHT + 20 }]}>
      <PressableScale
        testID={testID}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        pressedScale={0.92}
        accessibilityLabel={label}
        style={[styles.fab, extended && styles.extended]}>
        <Icon name={icon} size={22} tone="onPrimary" />
        {extended ? (
          <Text variant="button" tone="onPrimary">
            {label}
          </Text>
        ) : null}
      </PressableScale>
    </Animated.View>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { position: 'absolute', right: t.gutter },
  fab: {
    height: 56,
    minWidth: 56,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: t.space.sm,
    backgroundColor: t.colors.primary,
    ...t.elevation.floating,
  },
  extended: { paddingHorizontal: t.space.xl },
}));

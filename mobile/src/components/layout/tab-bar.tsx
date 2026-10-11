import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { duration, makeStyles, spring, TAB_BAR_HEIGHT, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';
import { Icon, type IconName } from '../ui/icon';
import { Text } from '../ui/text';

export const TAB_ICONS: Record<string, IconName> = {
  index: 'sun',
  tasks: 'check-circle',
  money: 'pie-chart',
  bills: 'calendar',
  lists: 'shopping-cart',
};

/**
 * Floating tab bar. A soft sage pill glides behind the active icon, and the
 * active label gains weight and colour. Labels stay visible on every tab
 * (icons alone are ambiguous), and every target is at least 48dp.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const slot = width / count;
  const x = useSharedValue(0);

  useEffect(() => {
    if (slot > 0) x.value = withSpring(state.index * slot, spring.glide);
  }, [state.index, slot, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} accessibilityRole="tablist">
        {slot > 0 ? (
          <Animated.View style={[styles.indicatorSlot, { width: slot }, indicator]}>
            <View style={styles.indicator} />
          </Animated.View>
        ) : null}
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key]!;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              label={label}
              icon={TAB_ICONS[route.name] ?? 'circle'}
              focused={focused}
              color={focused ? t.colors.primaryStrong : t.colors.textSecondary}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptics.selection();
                  navigation.navigate(route.name, route.params);
                }
              }}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabItemProps {
  label: string;
  icon: IconName;
  focused: boolean;
  color: string;
  onPress: () => void;
  onLongPress: () => void;
}

function TabItem({ label, icon, focused, color, onPress, onLongPress }: TabItemProps) {
  const styles = useStyles();
  const lift = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    lift.value = withTiming(focused ? 1 : 0, { duration: duration.base });
  }, [focused, lift]);
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -1.5 * lift.value }, { scale: 1 + 0.06 * lift.value }] }));

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.item}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}>
      <Animated.View style={iconStyle}>
        <Icon name={icon} size={21} color={color} />
      </Animated.View>
      <Text variant="label" color={color} style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const useStyles = makeStyles((t) => ({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: t.space.md },
  bar: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    borderRadius: 24,
    backgroundColor: t.colors.surface,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 560,
    ...t.elevation.floating,
    ...t.elevation.hairline,
  },
  indicatorSlot: { position: 'absolute', top: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  indicator: {
    width: '78%',
    maxWidth: 76,
    height: 52,
    borderRadius: 18,
    backgroundColor: t.colors.primarySoft,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontSize: 11, lineHeight: 14 },
  labelActive: { fontFamily: 'Inter_600SemiBold' },
}));

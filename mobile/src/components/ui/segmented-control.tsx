import { useState } from 'react';
import { Pressable, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { makeStyles, spring } from '@/theme';
import { haptics } from '@/utils/haptics';
import { Text } from './text';

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
}

/** Segments with a thumb that glides to the selected option. */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const segment = width / options.length;

  const thumbStyle = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: withSpring(index * segment, spring.glide) }],
  }));

  return (
    <View
      style={styles.track}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width - 8)}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}>
      {width > 0 ? <Animated.View style={[styles.thumb, thumbStyle]} /> : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={o.count != null ? `${o.label}, ${o.count}` : o.label}
            onPress={() => {
              if (!selected) {
                haptics.selection();
                onChange(o.value);
              }
            }}>
            <Text variant="label" tone={selected ? 'text' : 'textSecondary'} numberOfLines={1}>
              {o.label}
              {o.count != null && o.count > 0 ? <Text variant="label" tone="textTertiary">{`  ${o.count}`}</Text> : null}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceMuted,
  },
  thumb: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: t.radius.sm,
    backgroundColor: t.colors.surface,
    ...t.elevation.card,
  },
  segment: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center', paddingHorizontal: t.space.xs },
}));

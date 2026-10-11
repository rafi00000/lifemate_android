import { useEffect } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { makeStyles } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Placeholder that mirrors the real layout, so content appears without a
 * jump. A slow, low-contrast breathing pulse signals "loading"; it stops as
 * soon as the skeleton unmounts, and holds still under reduced motion.
 */
export function Skeleton({ width = '100%', height = 14, radius = 8, style }: SkeletonProps) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(opacity);
  }, [opacity, reduceMotion]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.block, { width, height, borderRadius: radius }, animated, style]} />;
}

/** A row that matches TaskRow / ExpenseRow proportions. */
export function SkeletonRow() {
  const styles = useStyles();
  return (
    <View style={styles.row}>
      <Skeleton width={36} height={36} radius={18} />
      <View style={styles.rowText}>
        <Skeleton width="62%" height={14} />
        <Skeleton width="38%" height={11} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View accessibilityLabel="Loading" accessibilityRole="progressbar">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  block: { backgroundColor: t.colors.track },
  row: { flexDirection: 'row', alignItems: 'center', gap: t.space.md, paddingVertical: t.space.md },
  rowText: { flex: 1, gap: t.space.sm },
}));

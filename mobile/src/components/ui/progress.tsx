import { useEffect, type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { duration, easing, makeStyles, useTheme } from '@/theme';
import type { BudgetState } from '@/types/api';

export function useStateColor(state: BudgetState | 'neutral') {
  const t = useTheme();
  return {
    ok: t.colors.primary,
    neutral: t.colors.primary,
    warning: t.colors.warning,
    over: t.colors.danger,
  }[state];
}

interface ProgressBarProps {
  /** 0..1; values above 1 render full (the caller shows "over" in text). */
  value: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Fills smoothly from its previous value, so changes are easy to notice. */
export function ProgressBar({ value, color, height = 8, style, accessibilityLabel }: ProgressBarProps) {
  const t = useTheme();
  const styles = useStyles();
  const clamped = Math.max(0, Math.min(1, value));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: duration.progress, easing: easing.inOut });
  }, [clamped, progress]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }, style]}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Animated.View style={[styles.fill, { borderRadius: height / 2, backgroundColor: color ?? t.colors.primary }, fillStyle]} />
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
  accessibilityLabel?: string;
}

export function ProgressRing({ value, size = 76, stroke = 8, color, trackColor, children, accessibilityLabel }: ProgressRingProps) {
  const t = useTheme();
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(clamped, { duration: duration.progress + 100, easing: easing.inOut });
  }, [clamped, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor ?? t.colors.track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color ?? t.colors.primary}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  track: { backgroundColor: t.colors.track, overflow: 'hidden', width: '100%' },
  fill: { height: '100%' },
}));

import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { duration, easing, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface DonutSegment {
  key: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  children?: ReactNode;
  accessibilityLabel: string;
}

/**
 * Category share of spending. Segments sweep in together from 12 o'clock,
 * with a small gap between them so adjacent colours never blur together.
 */
export function DonutChart({ segments, size = 168, stroke = 18, children, accessibilityLabel }: DonutChartProps) {
  const t = useTheme();
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = useSharedValue(0);
  const gap = segments.length > 1 ? Math.min(6, c * 0.012) : 0;

  const signature = segments.map((s) => `${s.key}:${s.value}`).join('|');
  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: duration.progress + 200, easing: easing.inOut });
  }, [signature, progress]);

  // Each arc starts where the previous ones end (cumulative share of the ring).
  const arcs = segments.map((s, i) => {
    const before = segments.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    const fraction = total > 0 ? s.value / total : 0;
    return { ...s, length: Math.max(0, fraction * c - gap), start: total > 0 ? (before / total) * c : 0 };
  });

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}>
      {/* Rotated via style (not an SVG origin attribute) so 12 o'clock is the start on every platform. */}
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={t.colors.track} strokeWidth={stroke} fill="none" />
        {arcs.map((a) => (
          <Arc key={a.key} cx={size / 2} r={r} stroke={stroke} color={a.color} length={a.length} start={a.start} circumference={c} progress={progress} />
        ))}
      </Svg>
      {children}
    </View>
  );
}

interface ArcProps {
  cx: number;
  r: number;
  stroke: number;
  color: string;
  length: number;
  start: number;
  circumference: number;
  progress: ReturnType<typeof useSharedValue<number>>;
}

function Arc({ cx, r, stroke, color, length, start, circumference, progress }: ArcProps) {
  const animatedProps = useAnimatedProps(() => {
    const visible = length * progress.value;
    return {
      strokeDasharray: [visible, circumference],
      strokeDashoffset: -start * progress.value,
    };
  });
  return (
    <AnimatedCircle
      cx={cx}
      cy={cx}
      r={r}
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="butt"
      fill="none"
      animatedProps={animatedProps}
    />
  );
}

import { useEffect } from 'react';
import Animated, {
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { duration, easing, spring, useTheme } from '@/theme';
import { haptics } from '@/utils/haptics';
import { PressableScale } from './pressable-scale';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_LENGTH = 14; // approximate length of the tick path below

interface CheckboxProps {
  checked: boolean;
  onToggle: () => void;
  /** Ring colour while unchecked (e.g. task priority). */
  ringColor?: string;
  size?: number;
  label: string;
  disabled?: boolean;
  testID?: string;
}

/**
 * Round checkbox. On check: the circle fills, a small pop, and the tick
 * draws itself — a satisfying confirmation that takes about half a second
 * but never blocks the next tap.
 */
export function Checkbox({ checked, onToggle, ringColor, size = 26, label, disabled, testID }: CheckboxProps) {
  const t = useTheme();
  const progress = useSharedValue(checked ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(checked ? 1 : 0, { duration: duration.base, easing: easing.standard });
    if (checked) {
      scale.value = withSequence(withTiming(0.86, { duration: 90 }), withSpring(1, spring.pop));
    }
  }, [checked, progress, scale]);

  const ring = ringColor ?? t.colors.borderStrong;
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(progress.value, [0, 1], [ring, t.colors.success]),
    backgroundColor: interpolateColor(progress.value, [0, 1], ['rgba(0,0,0,0)', t.colors.success]),
  }));
  const tickProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - progress.value),
  }));

  return (
    <PressableScale
      testID={testID}
      onPress={() => {
        if (!checked) haptics.success();
        else haptics.selection();
        onToggle();
      }}
      disabled={disabled}
      pressedScale={0.88}
      hitSlop={(48 - size) / 2}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled: !!disabled }}>
      <Animated.View
        style={[
          { width: size, height: size, borderRadius: size / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
          circleStyle,
        ]}>
        <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 16 16">
          <AnimatedPath
            d="M3.5 8.5 L6.6 11.4 L12.5 5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={CHECK_LENGTH}
            animatedProps={tickProps}
          />
        </Svg>
      </Animated.View>
    </PressableScale>
  );
}

import { forwardRef, type ReactNode } from 'react';
import { Pressable, type PressableProps, type StyleProp, type View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { spring } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style' | 'children'> {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  /** How far to shrink on press. Small surfaces can afford more. */
  pressedScale?: number;
}

/**
 * Pressable with a soft spring "give" on touch. Runs on the UI thread, so the
 * feedback is immediate even while JS is busy (e.g. a request in flight).
 */
export const PressableScale = forwardRef<View, PressableScaleProps>(function PressableScale(
  { style, children, pressedScale = 0.97, onPressIn, onPressOut, disabled, ...rest },
  ref,
) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      ref={ref}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled: !!disabled }}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, spring.press);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, spring.press);
        onPressOut?.(e);
      }}
      style={[style, animatedStyle]}
      {...rest}>
      {children}
    </AnimatedPressable>
  );
});

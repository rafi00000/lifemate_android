import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import { duration } from '@/theme';
import { formatMoney } from '@/utils/money';
import { Text, type TextProps } from './text';

interface AnimatedAmountProps extends Omit<TextProps, 'children'> {
  /** Minor units. */
  value: number;
  format?: (minor: number) => string;
}

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

/**
 * Counts gently from the previous amount to the new one. Text content can't
 * be animated on the UI thread, so this runs a short requestAnimationFrame
 * loop only while the value changes (~0.5 s), then stops. With "reduce
 * motion" on, the new value appears immediately.
 */
export function AnimatedAmount({ value, format = formatMoney, ...textProps }: AnimatedAmountProps) {
  const reduceMotion = useReducedMotion();
  const [shown, setShown] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    if (reduceMotion || from === value) {
      fromRef.current = value;
      setShown(value);
      return;
    }
    let frame = 0;
    const start = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration.progress);
      const current = Math.round(from + (value - from) * easeOutCubic(p));
      setShown(current);
      fromRef.current = current;
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, reduceMotion]);

  return (
    <Text accessibilityLabel={format(value)} {...textProps}>
      {format(shown)}
    </Text>
  );
}

import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles } from '@/theme';
import { PressableScale } from './pressable-scale';

interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  /** "muted" sits on the page without a border; "tinted" is the sage hero tone. */
  tone?: 'surface' | 'muted' | 'tinted';
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

/** Groups related content. Use only when grouping genuinely helps. */
export function Card({ children, onPress, tone = 'surface', padded = true, style, accessibilityLabel, accessibilityHint, testID }: CardProps) {
  const styles = useStyles();
  const composed = [styles.base, styles[tone], padded && styles.padded, style];
  if (onPress) {
    return (
      <PressableScale
        testID={testID}
        onPress={onPress}
        pressedScale={0.985}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={composed}>
        {children}
      </PressableScale>
    );
  }
  return (
    <View testID={testID} style={composed}>
      {children}
    </View>
  );
}

const useStyles = makeStyles((t) => ({
  base: { borderRadius: t.radius.lg, overflow: 'hidden' },
  padded: { padding: t.space.lg },
  surface: { backgroundColor: t.colors.surface, ...t.elevation.hairline, ...t.elevation.card },
  muted: { backgroundColor: t.colors.surfaceMuted },
  tinted: { backgroundColor: t.colors.primarySoft },
}));

import type { StyleProp, ViewStyle } from 'react-native';
import { makeStyles, useTheme, type ColorTokens } from '@/theme';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';

interface IconButtonProps {
  icon: IconName;
  /** Required: icon-only controls must be named for screen readers. */
  label: string;
  onPress?: () => void;
  variant?: 'plain' | 'soft' | 'filled';
  size?: number;
  tone?: keyof ColorTokens;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function IconButton({
  icon,
  label,
  onPress,
  variant = 'plain',
  size = 40,
  tone,
  disabled,
  style,
  testID,
}: IconButtonProps) {
  const t = useTheme();
  const styles = useStyles();
  const bg = { plain: 'transparent', soft: t.colors.surfaceMuted, filled: t.colors.primary }[variant];
  const fg = tone ? t.colors[tone] : variant === 'filled' ? t.colors.onPrimary : t.colors.text;
  // Visual size can be small; the touch area is always at least 48dp.
  const slop = Math.max(0, (48 - size) / 2);

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      hitSlop={slop}
      pressedScale={0.9}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }, disabled && styles.disabled, style]}>
      <Icon name={icon} size={Math.round(size * 0.5)} color={fg} />
    </PressableScale>
  );
}

const useStyles = makeStyles(() => ({
  base: { alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.4 },
}));

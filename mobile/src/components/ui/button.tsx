import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { HIT_TARGET, makeStyles, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
}

/**
 * Variants:
 *  - primary: the one main action on a screen or sheet
 *  - secondary: soft sage tint, for supporting actions
 *  - ghost: text-only, for low-emphasis actions ("Cancel", "See all")
 *  - danger: destructive confirmations only
 * Loading keeps the button's size (no layout jump) and blocks repeat taps.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const t = useTheme();
  const styles = useStyles();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: t.colors.primary, fg: t.colors.onPrimary },
    secondary: { bg: t.colors.primarySoft, fg: t.colors.primaryStrong },
    ghost: { bg: 'transparent', fg: t.colors.primary },
    danger: { bg: t.colors.danger, fg: '#FFFFFF' },
  }[variant];

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        size === 'lg' ? styles.lg : styles.md,
        { backgroundColor: palette.bg },
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}>
      <View style={[styles.content, loading && styles.hidden]}>
        {icon ? <Icon name={icon} size={18} color={palette.fg} /> : null}
        <Text variant="button" color={palette.fg} numberOfLines={1}>
          {label}
        </Text>
      </View>
      {loading ? <ActivityIndicator style={StyleSheet.absoluteFill} color={palette.fg} /> : null}
    </PressableScale>
  );
}

const useStyles = makeStyles((t) => ({
  base: {
    borderRadius: t.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.space.xl,
    minHeight: HIT_TARGET,
  },
  md: { height: HIT_TARGET },
  lg: { height: 54, borderRadius: t.radius.lg },
  ghost: { paddingHorizontal: t.space.md },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: 0.45 },
  content: { flexDirection: 'row', alignItems: 'center', gap: t.space.sm },
  hidden: { opacity: 0 },
}));

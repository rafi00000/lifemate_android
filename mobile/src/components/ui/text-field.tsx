import { forwardRef, useState, type ReactNode } from 'react';
import { Platform, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { duration, makeStyles, MAX_FONT_SCALE, useTheme } from '@/theme';
import { Icon, type IconName } from './icon';
import { IconButton } from './icon-button';
import { Text } from './text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  icon?: IconName;
  /** Adds a show/hide toggle and hides the value by default. */
  secureToggle?: boolean;
  trailing?: ReactNode;
  multiline?: boolean;
}

/**
 * Labelled input. The border eases to sage on focus and to the error tone on
 * a validation problem; the message below is announced to screen readers.
 */
export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helper, icon, secureToggle, trailing, multiline, onFocus, onBlur, editable = true, ...rest },
  ref,
) {
  const t = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const progress = useDerivedValue(() => withTiming(focused ? 1 : 0, { duration: duration.fast }), [focused]);
  const borderStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? t.colors.danger
      : interpolateColor(progress.value, [0, 1], [t.colors.surfaceMuted, t.colors.primary]),
  }));

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text variant="label" tone="textSecondary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <Animated.View style={[styles.field, multiline && styles.multiline, !editable && styles.disabled, borderStyle]}>
        {icon ? <Icon name={icon} size={18} tone="textTertiary" /> : null}
        <TextInput
          ref={ref}
          editable={editable}
          multiline={multiline}
          placeholderTextColor={t.colors.textTertiary}
          selectionColor={t.colors.primary}
          cursorColor={t.colors.primary}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          secureTextEntry={secureToggle ? hidden : rest.secureTextEntry}
          accessibilityLabel={label ?? rest.placeholder}
          accessibilityHint={error}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, multiline && styles.inputMultiline]}
          {...rest}
        />
        {secureToggle ? (
          <IconButton
            icon={hidden ? 'eye' : 'eye-off'}
            label={hidden ? 'Show password' : 'Hide password'}
            size={36}
            tone="textSecondary"
            onPress={() => setHidden((h) => !h)}
          />
        ) : null}
        {trailing}
      </Animated.View>
      {error ? (
        <Text variant="caption" tone="dangerText" accessibilityLiveRegion="polite" style={styles.message}>
          {error}
        </Text>
      ) : helper ? (
        <Text variant="caption" tone="textSecondary" style={styles.message}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  wrapper: { gap: t.space.xs + 2 },
  label: { marginLeft: t.space.xxs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.space.sm,
    minHeight: 52,
    paddingLeft: t.space.lg,
    paddingRight: t.space.xs,
    borderRadius: t.radius.md,
    backgroundColor: t.colors.surfaceMuted,
    borderWidth: 1.5,
  },
  multiline: { alignItems: 'flex-start', paddingTop: t.space.sm, paddingRight: t.space.lg },
  disabled: { opacity: 0.6 },
  input: {
    flex: 1,
    ...t.typography.body,
    color: t.colors.text,
    paddingVertical: t.space.md,
    // The field's border already shows focus; drop the browser's ring in web previews.
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
  message: { marginLeft: t.space.xxs },
}));

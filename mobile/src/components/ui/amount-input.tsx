import { forwardRef, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { makeStyles, MAX_FONT_SCALE, useTheme } from '@/theme';
import { CURRENCY_SYMBOL } from '@/utils/money';
import { Text } from './text';

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  autoFocus?: boolean;
  label?: string;
  onSubmitEditing?: () => void;
}

/**
 * Large, centred taka amount: the most important field gets the most space.
 * The input is sized to its content (measured with an invisible twin), so
 * "৳" and the number stay centred together on every platform.
 */
export const AmountInput = forwardRef<TextInput, AmountInputProps>(function AmountInput(
  { value, onChangeText, error, autoFocus, label = 'Amount', onSubmitEditing },
  ref,
) {
  const t = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(40);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text variant="amountL" tone={value ? 'text' : 'textTertiary'} style={styles.symbol}>
          {CURRENCY_SYMBOL}
        </Text>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={(text) => onChangeText(text.replace(/[^0-9.,]/g, ''))}
          placeholder="0"
          placeholderTextColor={t.colors.textTertiary}
          keyboardType="decimal-pad"
          returnKeyType="done"
          autoFocus={autoFocus}
          onSubmitEditing={onSubmitEditing}
          maxLength={14}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          selectionColor={t.colors.primary}
          cursorColor={t.colors.primary}
          accessibilityLabel={`${label} in taka`}
          accessibilityHint={error}
          style={[styles.input, { width: width + 6, color: t.colors.text }]}
        />
        {/* Invisible twin that measures the rendered width of the value. */}
        <Text
          variant="amountXL"
          style={[styles.input, styles.measure]}
          onLayout={(e) => setWidth(Math.ceil(e.nativeEvent.layout.width))}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants">
          {value || '0'}
        </Text>
      </View>
      {error ? (
        <Text variant="caption" tone="dangerText" align="center" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const useStyles = makeStyles((t) => ({
  wrap: { alignItems: 'center', gap: t.space.xs, paddingVertical: t.space.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' },
  symbol: { marginRight: t.space.xs, fontSize: 28, lineHeight: 36 },
  input: {
    ...t.typography.amountXL,
    fontSize: 40,
    lineHeight: 48,
    paddingVertical: 0,
    paddingHorizontal: 0,
    maxWidth: 280,
    ...(Platform.OS === 'web' ? { outlineWidth: 0 } : null),
  },
  measure: { position: 'absolute', opacity: 0, left: 0, top: 0 },
}));

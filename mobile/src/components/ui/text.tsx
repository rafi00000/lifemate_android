import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { MAX_FONT_SCALE, useTheme, type ColorTokens, type TypographyVariant } from '@/theme';

export type TextTone = keyof Pick<
  ColorTokens,
  | 'text'
  | 'textSecondary'
  | 'textTertiary'
  | 'primary'
  | 'primaryStrong'
  | 'onPrimary'
  | 'successText'
  | 'warningText'
  | 'dangerText'
  | 'accentText'
>;

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  tone?: TextTone;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

/** The only text primitive: typography and colour always come from tokens. */
export function Text({ variant = 'body', tone = 'text', color, align, style, ...rest }: TextProps) {
  const t = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={MAX_FONT_SCALE}
      {...rest}
      style={[t.typography[variant], { color: color ?? t.colors[tone] }, align && { textAlign: align }, style]}
    />
  );
}

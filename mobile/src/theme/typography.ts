import type { TextStyle } from 'react-native';

/**
 * Two families with distinct jobs:
 *  - Fraunces (soft serif) only for the greeting and screen titles. It gives
 *    LifeMate a warm, personal voice without decorating everything else.
 *  - Inter for all UI text and numbers. Financial values use tabular figures
 *    so amounts line up and don't jitter while animating.
 *
 * Android ignores `fontWeight` for custom fonts, so each weight is its own
 * family name.
 */
export const fonts = {
  serif: 'Fraunces_600SemiBold',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

export const typography = {
  display: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 38, letterSpacing: -0.4 },
  title: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 32, letterSpacing: -0.3 },
  headline: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26, letterSpacing: -0.2 },
  section: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.1 },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 },
  callout: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  amountXL: { fontFamily: fonts.semibold, fontSize: 34, lineHeight: 40, letterSpacing: -0.6, fontVariant: tabular },
  amountL: { fontFamily: fonts.semibold, fontSize: 22, lineHeight: 28, letterSpacing: -0.3, fontVariant: tabular },
  amount: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20, fontVariant: tabular },
  amountSmall: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, fontVariant: tabular },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Keeps large accessibility text usable without breaking dense layouts. */
export const MAX_FONT_SCALE = 1.35;

import type { ViewStyle } from 'react-native';
import type { ColorTokens } from './colors';

/**
 * Elevation is deliberately quiet: resting cards are separated from the page
 * by tone and a hairline, not by shadow. Only things that float (tab bar,
 * sheets, FAB, toasts) cast a soft, wide shadow. `boxShadow` renders
 * consistently on Android (new architecture) and web.
 */
export function elevation(colors: ColorTokens, scheme: 'light' | 'dark') {
  const tint = scheme === 'light' ? '30, 58, 51' : '0, 0, 0';
  return {
    none: {} as ViewStyle,
    card: (scheme === 'light'
      ? { boxShadow: `0px 1px 2px rgba(${tint}, 0.04), 0px 4px 14px rgba(${tint}, 0.04)` }
      : {}) as ViewStyle,
    floating: { boxShadow: `0px 10px 30px rgba(${tint}, ${scheme === 'light' ? 0.12 : 0.45})` } as ViewStyle,
    hairline: { borderWidth: 1, borderColor: colors.border } as ViewStyle,
  };
}

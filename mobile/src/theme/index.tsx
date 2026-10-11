import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { usePreferences } from '@/store/preferences';
import { categoryColors, darkColors, lightColors, type ColorTokens } from './colors';
import { elevation } from './elevation';
import { radius, SCREEN_GUTTER, space } from './spacing';
import { typography } from './typography';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  categoryColors: typeof categoryColors;
  typography: typeof typography;
  space: typeof space;
  radius: typeof radius;
  gutter: number;
  elevation: ReturnType<typeof elevation>;
}

function buildTheme(scheme: 'light' | 'dark'): Theme {
  const colors = scheme === 'dark' ? darkColors : lightColors;
  return {
    scheme,
    colors,
    categoryColors,
    typography,
    space,
    radius,
    gutter: SCREEN_GUTTER,
    elevation: elevation(colors, scheme),
  };
}

const lightTheme = buildTheme('light');
const darkTheme = buildTheme('dark');

const ThemeContext = createContext<Theme>(lightTheme);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const mode = usePreferences((s) => s.themeMode);
  const scheme = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  return <ThemeContext.Provider value={scheme === 'dark' ? darkTheme : lightTheme}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/**
 * Theme-aware StyleSheet factory. Styles are created once per theme, not per
 * render:  const useStyles = makeStyles((t) => ({ card: { ... } }));
 */
export function makeStyles<T extends StyleSheet.NamedStyles<T>>(factory: (theme: Theme) => T) {
  const cache = new WeakMap<Theme, T>();
  return function useStyles(): T {
    const theme = useTheme();
    return useMemo(() => {
      let styles = cache.get(theme);
      if (!styles) {
        styles = StyleSheet.create(factory(theme));
        cache.set(theme, styles);
      }
      return styles;
    }, [theme]);
  };
}

export { categoryColors, lightColors, darkColors, type ColorTokens } from './colors';
export { typography, fonts, MAX_FONT_SCALE, type TypographyVariant } from './typography';
export { space, radius, SCREEN_GUTTER, HIT_TARGET, TAB_BAR_HEIGHT } from './spacing';
export * from './motion';

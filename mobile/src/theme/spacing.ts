/** 4-point spacing scale. Use these names, never raw numbers, for layout. */
export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

/** Horizontal page gutter; generous enough to feel calm on 360dp phones. */
export const SCREEN_GUTTER = space.xl;

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Minimum touch target (Material guidance is 48dp). */
export const HIT_TARGET = 48;

/** Height of the floating tab bar, excluding the bottom safe-area inset. */
export const TAB_BAR_HEIGHT = 64;

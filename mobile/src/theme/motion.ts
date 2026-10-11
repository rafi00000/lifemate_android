import { Platform } from 'react-native';
import { Easing, FadeIn, FadeInDown, FadeOut, LinearTransition, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Motion language: gentle, quick to respond, never in the way.
 * - Feedback (press, toggle) is fast so the app feels immediate.
 * - Entrances are short and soft (small travel distance, decelerating curve).
 * - Progress and numbers ease over ~half a second so change is noticeable.
 * Reanimated honours the OS "remove animations" setting by default
 * (ReduceMotion.System), so every animation built from these tokens
 * collapses to an instant change for users who ask for less motion.
 */
export const duration = {
  press: 120,
  fast: 180,
  base: 260,
  entrance: 320,
  progress: 520,
  celebrate: 560,
} as const;

export const easing = {
  /** Decelerate: things arriving or settling. */
  standard: Easing.bezier(0.2, 0, 0, 1),
  /** Accelerate: things leaving. */
  exit: Easing.bezier(0.4, 0, 1, 1),
  /** Smooth both ends: values morphing in place (progress, numbers). */
  inOut: Easing.bezier(0.45, 0, 0.25, 1),
} as const;

export const spring = {
  /** Press-in scale feedback. */
  press: { damping: 20, stiffness: 420, mass: 0.6 },
  /** Toggles and small pops (checkbox). Slight overshoot, settles quickly. */
  pop: { damping: 13, stiffness: 260, mass: 0.7 },
  /** Bottom sheets and larger surfaces. No visible bounce. */
  sheet: { damping: 26, stiffness: 240, mass: 1 },
  /** Tab indicator gliding between tabs. */
  glide: { damping: 22, stiffness: 260, mass: 0.8 },
} satisfies Record<string, WithSpringConfig>;

/**
 * Staggered card entrance for dashboards and lists (index = position).
 * On Android the card rises a subtle 10dp. Web previews use the stock preset:
 * Reanimated's web layer pins customised entering animations to
 * `position: absolute` once they finish, which breaks page layout.
 */
export const enterCard = (index = 0) => {
  const base = FadeInDown.duration(duration.entrance)
    .delay(Math.min(index, 6) * 50)
    .easing(easing.standard);
  return Platform.OS === 'web' ? base : base.withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] });
};

export const enterFade = FadeIn.duration(duration.base).easing(easing.standard);
export const exitFade = FadeOut.duration(duration.fast).easing(easing.exit);
/** Neighbours sliding into place when a row is inserted or removed. */
export const layoutTransition = LinearTransition.duration(duration.base).easing(easing.standard);

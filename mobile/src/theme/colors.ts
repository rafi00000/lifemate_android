/**
 * LifeMate colour tokens.
 *
 * Built from the proposal's sage / muted-teal direction, then adjusted for
 * WCAG AA: primary text on background ≈ 12:1, secondary text ≈ 4.9:1, white
 * on primary ≈ 4.9:1. Status colours come in three roles: a fill for bars and
 * icons, a soft tint for backgrounds, and a darker "text" tone that stays
 * readable on light surfaces. Never use the fill colour for body text.
 */

export interface ColorTokens {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceRaised: string;
  border: string;
  borderStrong: string;

  primary: string;
  primaryPressed: string;
  primaryStrong: string;
  primarySoft: string;
  onPrimary: string;
  secondary: string;

  text: string;
  textSecondary: string;
  textTertiary: string;

  accent: string;
  accentSoft: string;
  accentText: string;
  success: string;
  successSoft: string;
  successText: string;
  warning: string;
  warningSoft: string;
  warningText: string;
  danger: string;
  dangerSoft: string;
  dangerText: string;

  track: string;
  overlay: string;
  shadow: string;
}

export const lightColors: ColorTokens = {
  background: '#F6F8F5',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF3EF',
  surfaceRaised: '#FFFFFF',
  border: '#E3EAE5',
  borderStrong: '#CCD7D1',

  primary: '#4F7A6F',
  primaryPressed: '#41685E',
  primaryStrong: '#315B52',
  primarySoft: '#E2EDE8',
  onPrimary: '#FFFFFF',
  secondary: '#A8C9BC',

  text: '#22332E',
  textSecondary: '#61706A',
  textTertiary: '#8B9792',

  accent: '#D3A86F',
  accentSoft: '#F6EEE2',
  accentText: '#85602F',
  success: '#5B9B78',
  successSoft: '#E3F0E8',
  successText: '#36704F',
  warning: '#D9A65A',
  warningSoft: '#FAF0DE',
  warningText: '#8A5F1C',
  danger: '#C96F6F',
  dangerSoft: '#F8E8E6',
  dangerText: '#A24545',

  track: '#E5ECE7',
  overlay: 'rgba(20, 32, 28, 0.38)',
  shadow: '#1E3A33',
};

export const darkColors: ColorTokens = {
  background: '#111715',
  surface: '#18201D',
  surfaceMuted: '#202A27',
  surfaceRaised: '#1E2724',
  border: '#28332F',
  borderStrong: '#36433E',

  primary: '#8DBBAC',
  primaryPressed: '#7DAA9B',
  primaryStrong: '#B6D7CC',
  primarySoft: '#1E302A',
  onPrimary: '#0F1B17',
  secondary: '#5E8A7C',

  text: '#E5ECE9',
  textSecondary: '#A3B1AB',
  textTertiary: '#76847E',

  accent: '#D9B583',
  accentSoft: '#2D271E',
  accentText: '#E4C79B',
  success: '#7DBB98',
  successSoft: '#1B2D23',
  successText: '#98CDAE',
  warning: '#E0B36D',
  warningSoft: '#2F2819',
  warningText: '#EBCB92',
  danger: '#DE8A8A',
  dangerSoft: '#341F1E',
  dangerText: '#F0A7A7',

  track: '#26302C',
  overlay: 'rgba(0, 0, 0, 0.55)',
  shadow: '#000000',
};

/**
 * Category hues: muted, mid-luminance tones that sit calmly beside the sage
 * brand colour in both themes. Charts always pair them with text labels, so
 * colour is never the only carrier of meaning.
 */
export const categoryColors = {
  food: '#5E9C86',
  transport: '#6C8EB8',
  shopping: '#C98A79',
  bills: '#D2A55A',
  health: '#86AE6A',
  education: '#8F80BC',
  entertainment: '#CF8CA6',
  housing: '#A88B6B',
  other: '#97A39E',
} as const;

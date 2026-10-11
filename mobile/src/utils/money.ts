/**
 * Money is handled in integer minor units (poisha) end to end, matching the
 * API. Floating point only appears at the edges: parsing what the user
 * typed, and formatting for display.
 */

export const CURRENCY_SYMBOL = '৳';

/**
 * Groups digits the South Asian way used in Bangladesh: the last three
 * digits, then pairs. 1234567 -> "12,34,567".
 */
export function groupLakh(digits: string): string {
  if (digits.length <= 3) return digits;
  const last3 = digits.slice(-3);
  const rest = digits.slice(0, -3);
  return `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
}

interface FormatOptions {
  /** Show poisha even when zero ("৳120.00"). Default: only when non-zero. */
  forceDecimals?: boolean;
  /** Prefix with the taka sign. Default true. */
  symbol?: boolean;
  /** Show "+" for positive values (for deltas). */
  signed?: boolean;
}

export function formatMoney(minor: number, opts: FormatOptions = {}): string {
  const { forceDecimals = false, symbol = true, signed = false } = opts;
  const safe = Number.isFinite(minor) ? Math.round(minor) : 0;
  const negative = safe < 0;
  const abs = Math.abs(safe);
  const whole = Math.floor(abs / 100);
  const fraction = abs % 100;
  const decimals = forceDecimals || fraction !== 0 ? `.${String(fraction).padStart(2, '0')}` : '';
  const sign = negative ? '−' : signed && safe > 0 ? '+' : '';
  return `${sign}${symbol ? CURRENCY_SYMBOL : ''}${groupLakh(String(whole))}${decimals}`;
}

/** Compact form for chart axes and tight spaces: ৳950, ৳12.5k, ৳1.2L. */
export function formatMoneyCompact(minor: number): string {
  const taka = Math.abs(minor) / 100;
  const sign = minor < 0 ? '−' : '';
  if (taka >= 100_000) return `${sign}${CURRENCY_SYMBOL}${trimZero((taka / 100_000).toFixed(1))}L`;
  if (taka >= 1_000) return `${sign}${CURRENCY_SYMBOL}${trimZero((taka / 1_000).toFixed(1))}k`;
  return `${sign}${CURRENCY_SYMBOL}${Math.round(taka)}`;
}

const trimZero = (s: string) => s.replace(/\.0$/, '');

/**
 * Parses user input like "1,250.5" or "৳ 300" into poisha. Returns null for
 * anything that is not a positive amount with at most two decimals, so the
 * form can show a precise error instead of guessing.
 */
export function parseMoneyInput(input: string): number | null {
  const cleaned = input.replace(/[৳,\s]/g, '').replace(/^tk\.?/i, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, frac = ''] = cleaned.split('.') as [string, string?];
  const minor = Number(whole) * 100 + Number((frac + '00').slice(0, 2));
  if (!Number.isSafeInteger(minor) || minor <= 0) return null;
  return minor;
}

/** Inverse of parseMoneyInput, for pre-filling edit forms ("1250.5"). */
export function toMoneyInput(minor: number): string {
  const whole = Math.floor(minor / 100);
  const fraction = minor % 100;
  if (fraction === 0) return String(whole);
  return `${whole}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
}

/** Percentage 0-100 for display, without NaN for empty budgets. */
export function percentOf(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

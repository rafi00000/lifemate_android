/**
 * Client-side validation mirrors the API's rules so users get instant,
 * specific feedback. The server re-validates everything; these are a
 * courtesy, not a security boundary.
 */

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(email: string): string | undefined {
  const v = email.trim();
  if (!v) return 'Enter your email address';
  if (!EMAIL_RE.test(v) || v.length > 254) return 'Enter a valid email address';
  return undefined;
}

export function validateNewPassword(password: string): string | undefined {
  if (password.length < 8) return 'Use at least 8 characters';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Include at least one letter and one number';
  if (new TextEncoder().encode(password).length > 72) return 'Password is too long';
  return undefined;
}

export function validateName(name: string): string | undefined {
  const v = name.trim();
  if (!v) return 'Enter your name';
  if (v.length > 60) return 'Name is too long';
  return undefined;
}

export function validateRequired(value: string, label: string, max: number): string | undefined {
  const v = value.trim();
  if (!v) return `${label} is required`;
  if (v.length > max) return `${label} is too long`;
  return undefined;
}

/** Password strength hint for the sign-up form (0-3), not a gate. */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 {
  if (validateNewPassword(password)) return password.length ? 1 : 0;
  let score = 2;
  if (password.length >= 12 && /[^A-Za-z0-9]/.test(password)) score = 3;
  return score as 2 | 3;
}

export const hasErrors = (errors: Record<string, string | undefined>) => Object.values(errors).some(Boolean);

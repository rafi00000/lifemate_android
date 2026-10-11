import { z } from 'zod';

export const zEmail = z.string().trim().toLowerCase().max(254).pipe(z.email('Enter a valid email address'));

// bcrypt only reads the first 72 bytes, so longer passwords are refused
// rather than silently truncated.
export const zPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((p) => Buffer.byteLength(p, 'utf8') <= 72, 'Password is too long')
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), 'Password must contain a letter and a number');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  email: zEmail,
  password: zPassword,
});

export const loginSchema = z.object({
  email: zEmail,
  // No strength rules on login: just bound the input.
  password: z.string().min(1, 'Password is required').max(200),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20).max(200),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

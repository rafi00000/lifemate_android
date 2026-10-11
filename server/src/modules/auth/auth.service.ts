import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { AppError, conflict, unauthenticated } from '../../lib/errors.js';
import { UserModel, type UserDoc } from '../users/user.model.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';
import { issueRefreshToken, rotateRefreshToken, signAccessToken } from './token.service.js';

export interface AuthResult {
  user: UserDoc;
  accessToken: string;
  refreshToken: string;
}

// Compared against when the email is unknown, so a failed login takes the same
// time whether or not the account exists (no user enumeration by timing).
let dummyHash: string | undefined;
async function getDummyHash() {
  dummyHash ??= await bcrypt.hash('lifemate-timing-equaliser', env.BCRYPT_ROUNDS);
  return dummyHash;
}

async function startSession(user: UserDoc, tokenVersion: number): Promise<AuthResult> {
  const accessToken = signAccessToken(user.id, tokenVersion);
  const refreshToken = await issueRefreshToken(user.id);
  return { user, accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const exists = await UserModel.exists({ email: input.email });
  if (exists) throw conflict('An account with this email already exists.');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  try {
    const user = await UserModel.create({ name: input.name, email: input.email, passwordHash });
    return startSession(user, 0);
  } catch (err) {
    // Two simultaneous sign-ups with one email: the unique index decides.
    if ((err as { code?: number }).code === 11000) throw conflict('An account with this email already exists.');
    throw err;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await UserModel.findOne({ email: input.email }).select('+passwordHash +tokenVersion');
  const hash = user?.passwordHash ?? (await getDummyHash());
  const ok = await bcrypt.compare(input.password, hash);
  if (!user || !ok) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  return startSession(user, user.tokenVersion ?? 0);
}

export async function refresh(refreshToken: string): Promise<AuthResult> {
  const rotated = await rotateRefreshToken(refreshToken);
  const user = await UserModel.findById(rotated.userId).select('+tokenVersion');
  if (!user) throw unauthenticated();
  return {
    user,
    accessToken: signAccessToken(user.id, user.tokenVersion ?? 0),
    refreshToken: rotated.refreshToken,
  };
}

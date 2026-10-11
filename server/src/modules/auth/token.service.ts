import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError, unauthenticated } from '../../lib/errors.js';
import { RefreshTokenModel } from './refresh-token.model.js';

const ISSUER = 'lifemate-api';
const AUDIENCE = 'lifemate-app';

interface AccessClaims {
  sub: string;
  ver: number;
}

export function signAccessToken(userId: string, tokenVersion: number): string {
  const claims: AccessClaims = { sub: userId, ver: tokenVersion };
  return jwt.sign(claims, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

export function verifyAccessToken(token: string): AccessClaims {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') throw unauthenticated();
    return { sub: payload.sub, ver: typeof payload.ver === 'number' ? payload.ver : 0 };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Your session has expired.');
    }
    throw unauthenticated('Your session is invalid. Please sign in again.');
  }
}

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function issueRefreshToken(userId: string, family = crypto.randomUUID()): Promise<string> {
  const token = crypto.randomBytes(48).toString('base64url');
  await RefreshTokenModel.create({
    user: userId,
    tokenHash: hashToken(token),
    family,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });
  return token;
}

/** Validates and rotates a refresh token, returning the owner and a new token. */
export async function rotateRefreshToken(token: string): Promise<{ userId: string; refreshToken: string }> {
  const tokenHash = hashToken(token);
  const record = await RefreshTokenModel.findOne({ tokenHash });
  if (!record || record.expiresAt.getTime() <= Date.now()) {
    throw unauthenticated('Your session has ended. Please sign in again.');
  }

  if (record.revokedAt) {
    // Reuse of a rotated token: assume theft and end every session in the family.
    await RefreshTokenModel.updateMany({ family: record.family, revokedAt: null }, { revokedAt: new Date() });
    throw unauthenticated('Your session has ended. Please sign in again.');
  }

  const newToken = crypto.randomBytes(48).toString('base64url');
  // Conditional update guards against two parallel refreshes both succeeding.
  const claimed = await RefreshTokenModel.findOneAndUpdate(
    { _id: record._id, revokedAt: null },
    { revokedAt: new Date(), replacedByHash: hashToken(newToken) },
  );
  if (!claimed) throw unauthenticated('Your session has ended. Please sign in again.');

  await RefreshTokenModel.create({
    user: record.user,
    tokenHash: hashToken(newToken),
    family: record.family,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });
  return { userId: String(record.user), refreshToken: newToken };
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const record = await RefreshTokenModel.findOne({ tokenHash: hashToken(token) });
  if (!record) return;
  await RefreshTokenModel.updateMany({ family: record.family, revokedAt: null }, { revokedAt: new Date() });
}

export async function revokeAllForUser(userId: string, exceptFamily?: string): Promise<void> {
  await RefreshTokenModel.updateMany(
    { user: userId, revokedAt: null, ...(exceptFamily ? { family: { $ne: exceptFamily } } : {}) },
    { revokedAt: new Date() },
  );
}

export async function familyOf(token: string): Promise<string | null> {
  const record = await RefreshTokenModel.findOne({ tokenHash: hashToken(token) }).select('family');
  return record?.family ?? null;
}

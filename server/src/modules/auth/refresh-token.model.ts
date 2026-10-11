import { Schema, model, Types } from '../../db/mongoose.js';

/**
 * Refresh tokens are opaque random strings. Only their SHA-256 hash is stored,
 * so a database leak does not hand out live sessions. Each login starts a
 * `family`; every refresh rotates the token inside that family. Presenting an
 * already-rotated token means it was stolen or replayed, so the whole family
 * is revoked.
 */
const refreshTokenSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByHash: { type: String, default: null },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ tokenHash: 1 }, { unique: true });
// MongoDB removes expired sessions automatically.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = model('RefreshToken', refreshTokenSchema);

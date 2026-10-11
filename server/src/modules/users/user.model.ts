import { Schema, model, type InferSchemaType, type HydratedDocument } from '../../db/mongoose.js';

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    currency: { type: String, enum: ['BDT'], default: 'BDT' },
    // Bumped on password change: access tokens carrying an older value are refused.
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });

export type User = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<User>;
export const UserModel = model('User', userSchema);

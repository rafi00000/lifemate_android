import { Router, type RequestHandler } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { AppError, notFound } from '../../lib/errors.js';
import { validate } from '../../lib/validation.js';
import { zPassword } from '../auth/auth.schema.js';
import { familyOf, revokeAllForUser, signAccessToken } from '../auth/token.service.js';
import { RefreshTokenModel } from '../auth/refresh-token.model.js';
import { BillModel } from '../bills/bill.model.js';
import { BudgetModel } from '../budgets/budget.model.js';
import { ExpenseModel } from '../expenses/expense.model.js';
import { GroceryItemModel, GroceryListModel } from '../groceries/grocery.model.js';
import { NoteModel } from '../notes/note.model.js';
import { TaskModel } from '../tasks/task.model.js';
import { UserModel } from './user.model.js';

const updateMeSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: zPassword,
  // Lets the device that changed the password stay signed in.
  refreshToken: z.string().min(20).max(200).optional(),
});

const deleteAccountSchema = z.object({ password: z.string().min(1).max(200) });

async function verifyPassword(userId: string, password: string) {
  const user = await UserModel.findById(userId).select('+passwordHash +tokenVersion');
  if (!user) throw notFound('User');
  if (!(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.');
  }
  return user;
}

const getMe: RequestHandler = async (_req, res) => {
  const user = await UserModel.findById(res.locals.userId);
  if (!user) throw notFound('User');
  res.json({ data: user });
};

const updateMe: RequestHandler = async (_req, res) => {
  const user = await UserModel.findByIdAndUpdate(res.locals.userId, { $set: res.locals.body }, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!user) throw notFound('User');
  res.json({ data: user });
};

/**
 * Changing the password signs out every other device: their refresh tokens
 * are revoked and the token version bump invalidates their access tokens.
 * The caller receives a fresh access token for the new version.
 */
const changePassword: RequestHandler = async (_req, res) => {
  const { currentPassword, newPassword, refreshToken } = res.locals.body as z.infer<typeof changePasswordSchema>;
  const user = await verifyPassword(res.locals.userId, currentPassword);
  user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();

  const keepFamily = refreshToken ? await familyOf(refreshToken) : null;
  await revokeAllForUser(user.id, keepFamily ?? undefined);
  res.json({ data: { accessToken: signAccessToken(user.id, user.tokenVersion) } });
};

/** Permanently removes the account and everything it owns. */
const deleteMe: RequestHandler = async (_req, res) => {
  const { password } = res.locals.body as z.infer<typeof deleteAccountSchema>;
  const user = await verifyPassword(res.locals.userId, password);
  const uid = user._id;

  const ownedLists = await GroceryListModel.find({ owner: uid }).select('_id');
  await Promise.all([
    TaskModel.deleteMany({ user: uid }),
    ExpenseModel.deleteMany({ user: uid }),
    BudgetModel.deleteMany({ user: uid }),
    BillModel.deleteMany({ user: uid }),
    NoteModel.deleteMany({ user: uid }),
    GroceryItemModel.deleteMany({ list: { $in: ownedLists.map((l) => l._id) } }),
    GroceryListModel.updateMany({ members: uid }, { $pull: { members: uid } }),
    RefreshTokenModel.deleteMany({ user: uid }),
  ]);
  await GroceryListModel.deleteMany({ owner: uid });
  await user.deleteOne();
  res.status(204).end();
};

export const userRouter = Router();
userRouter.get('/me', getMe);
userRouter.patch('/me', validate('body', updateMeSchema), updateMe);
userRouter.post('/me/password', validate('body', changePasswordSchema), changePassword);
userRouter.delete('/me', validate('body', deleteAccountSchema), deleteMe);

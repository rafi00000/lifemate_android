import { Schema, model, Types, type InferSchemaType } from '../../db/mongoose.js';
import { EXPENSE_CATEGORIES } from '../expenses/categories.js';

/**
 * One document per user per month holds that month's whole budget plan.
 * A month without its own document inherits the most recent earlier plan,
 * so users set a budget once and it carries forward, while past months keep
 * the limits that applied at the time.
 */
const categoryLimitSchema = new Schema(
  {
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    limit: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const budgetSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // "YYYY-MM"
    overall: { type: Number, min: 1, default: null }, // minor units
    categories: { type: [categoryLimitSchema], default: [] },
  },
  { timestamps: true },
);

budgetSchema.index({ user: 1, month: -1 }, { unique: true });

export type Budget = InferSchemaType<typeof budgetSchema>;
export const BudgetModel = model('Budget', budgetSchema);

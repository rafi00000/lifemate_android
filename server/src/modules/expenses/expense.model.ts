import { Schema, model, Types, type InferSchemaType } from '../../db/mongoose.js';
import { EXPENSE_CATEGORIES } from './categories.js';

const expenseSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    // Minor units (poisha): 125050 = ৳1,250.50. Integers keep sums exact.
    amount: { type: Number, required: true, min: 1 },
    category: { type: String, enum: EXPENSE_CATEGORIES, required: true },
    note: { type: String, trim: true, maxlength: 200, default: '' },
    // Local calendar date the money was spent ("YYYY-MM-DD").
    date: { type: String, required: true },
    // Set when the expense was logged by paying a bill.
    bill: { type: Types.ObjectId, ref: 'Bill', default: null },
  },
  { timestamps: true },
);

// Month listings and summaries are range scans on (user, date).
expenseSchema.index({ user: 1, date: -1, _id: -1 });

export type Expense = InferSchemaType<typeof expenseSchema>;
export const ExpenseModel = model('Expense', expenseSchema);

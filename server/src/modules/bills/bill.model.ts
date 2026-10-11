import { Schema, model, Types, type InferSchemaType, type HydratedDocument } from '../../db/mongoose.js';
import { EXPENSE_CATEGORIES } from '../expenses/categories.js';

export const BILL_RECURRENCES = ['none', 'weekly', 'monthly', 'yearly'] as const;

const lastPaymentSchema = new Schema(
  {
    dueDate: { type: String, required: true }, // the occurrence that was paid
    paidOn: { type: String, required: true },
    expense: { type: Types.ObjectId, ref: 'Expense', default: null },
  },
  { _id: false },
);

const billSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    amount: { type: Number, required: true, min: 1 }, // minor units
    category: { type: String, enum: EXPENSE_CATEGORIES, default: 'bills' },
    // Next unpaid occurrence for recurring bills; the due date for one-offs.
    dueDate: { type: String, required: true },
    recurrence: { type: String, enum: BILL_RECURRENCES, default: 'monthly' },
    anchorDay: { type: Number, min: 1, max: 31, required: true },
    reminderDaysBefore: { type: Number, min: 0, max: 14, default: 1 },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    // Only one-off bills become "paid"; recurring bills roll forward instead.
    isPaid: { type: Boolean, default: false },
    lastPayment: { type: lastPaymentSchema, default: null },
  },
  { timestamps: true },
);

billSchema.index({ user: 1, isPaid: 1, dueDate: 1 });

export type Bill = InferSchemaType<typeof billSchema>;
export type BillDoc = HydratedDocument<Bill>;
export const BillModel = model('Bill', billSchema);

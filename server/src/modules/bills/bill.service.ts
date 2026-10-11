import { nextOccurrence, parseDate } from '../../lib/calendar.js';
import { badRequest, conflict, notFound } from '../../lib/errors.js';
import { ExpenseModel } from '../expenses/expense.model.js';
import { BillModel, type BillDoc } from './bill.model.js';
import type { CreateBillInput, PayBillInput, UpdateBillInput } from './bill.schema.js';

async function findOwned(userId: string, id: string): Promise<BillDoc> {
  const bill = await BillModel.findOne({ _id: id, user: userId });
  if (!bill) throw notFound('Bill');
  return bill;
}

export async function listBills(userId: string, status: 'unpaid' | 'paid' | 'all') {
  const filter: Record<string, unknown> = { user: userId };
  if (status !== 'all') filter.isPaid = status === 'paid';
  return BillModel.find(filter).sort({ dueDate: 1, name: 1 });
}

export const getBill = findOwned;

export async function createBill(userId: string, input: CreateBillInput) {
  return BillModel.create({ ...input, user: userId, anchorDay: parseDate(input.dueDate).d });
}

export async function updateBill(userId: string, id: string, input: UpdateBillInput) {
  const bill = await findOwned(userId, id);
  bill.set(input);
  // Editing the due date re-anchors the series to the new day of month.
  if (input.dueDate) bill.anchorDay = parseDate(input.dueDate).d;
  await bill.save();
  return bill;
}

export async function deleteBill(userId: string, id: string) {
  const result = await BillModel.deleteOne({ _id: id, user: userId });
  if (result.deletedCount === 0) throw notFound('Bill');
}

/**
 * Pays the current occurrence. The bill update is conditional on the due date
 * the client saw, which makes the operation idempotent under double taps and
 * concurrent devices. Recurring bills roll to their next occurrence; one-off
 * bills become paid. Optionally logs the payment as an expense.
 */
export async function payBill(userId: string, id: string, input: PayBillInput) {
  const bill = await findOwned(userId, id);
  if (bill.isPaid) throw conflict('This bill is already paid.');
  if (bill.dueDate !== input.dueDate) throw conflict('This bill has changed. Refresh and try again.');

  const recurring = bill.recurrence !== 'none';
  const update = {
    isPaid: !recurring,
    dueDate: recurring ? nextOccurrence(bill.dueDate, bill.recurrence, bill.anchorDay) : bill.dueDate,
    lastPayment: { dueDate: bill.dueDate, paidOn: input.paidOn, expense: null as unknown },
  };

  const claimed = await BillModel.findOneAndUpdate(
    { _id: bill._id, user: userId, dueDate: input.dueDate, isPaid: false },
    { $set: update },
    { returnDocument: 'after' },
  );
  if (!claimed) throw conflict('This bill was just paid on another device.');

  if (input.logExpense) {
    const expense = await ExpenseModel.create({
      user: userId,
      amount: bill.amount,
      category: bill.category,
      note: bill.name,
      date: input.paidOn,
      bill: bill._id,
    });
    claimed.set('lastPayment.expense', expense._id);
    await claimed.save();
  }
  return claimed;
}

/** Restores the bill to the occurrence that was last paid and removes its expense. */
export async function undoPayment(userId: string, id: string) {
  const bill = await findOwned(userId, id);
  const last = bill.lastPayment;
  if (!last) throw badRequest('There is no payment to undo.');

  if (last.expense) await ExpenseModel.deleteOne({ _id: last.expense, user: userId });
  bill.dueDate = last.dueDate;
  bill.isPaid = false;
  bill.lastPayment = null;
  await bill.save();
  return bill;
}

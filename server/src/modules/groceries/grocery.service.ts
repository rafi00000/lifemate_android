import { Types } from 'mongoose';
import { AppError, badRequest, conflict, forbidden, notFound } from '../../lib/errors.js';
import { UserModel } from '../users/user.model.js';
import { GroceryItemModel, GroceryListModel, type GroceryListDoc } from './grocery.model.js';
import type { CreateItemInput, UpdateItemInput } from './grocery.schema.js';

const MAX_MEMBERS = 10;

const accessFilter = (userId: string) => ({ $or: [{ owner: userId }, { members: userId }] });

/** Owner or member access; otherwise "not found" so lists can't be probed. */
async function findAccessible(userId: string, listId: string): Promise<GroceryListDoc> {
  const list = await GroceryListModel.findOne({ _id: listId, ...accessFilter(userId) });
  if (!list) throw notFound('List');
  return list;
}

async function findOwnedList(userId: string, listId: string): Promise<GroceryListDoc> {
  const list = await findAccessible(userId, listId);
  if (String(list.owner) !== userId) throw forbidden('Only the list owner can do this.');
  return list;
}

/** Shapes a list for the client, with sharing info relative to the caller. */
async function present(list: GroceryListDoc, userId: string, counts?: { total: number; pending: number }) {
  const people = await UserModel.find({ _id: { $in: [list.owner, ...list.members] } })
    .select('name email')
    .lean();
  const byId = new Map(people.map((p) => [String(p._id), p]));
  const person = (id: Types.ObjectId) => {
    const p = byId.get(String(id));
    return { id: String(id), name: p?.name ?? 'Unknown', email: p?.email ?? '' };
  };
  return {
    id: list.id,
    name: list.name,
    isOwner: String(list.owner) === userId,
    owner: person(list.owner),
    members: list.members.map(person),
    totalItems: counts?.total ?? 0,
    pendingItems: counts?.pending ?? 0,
    createdAt: list.createdAt,
    updatedAt: list.updatedAt,
  };
}

async function countsFor(listIds: Types.ObjectId[]) {
  const rows = await GroceryItemModel.aggregate<{ _id: Types.ObjectId; total: number; pending: number }>([
    { $match: { list: { $in: listIds } } },
    {
      $group: {
        _id: '$list',
        total: { $sum: 1 },
        pending: { $sum: { $cond: ['$purchased', 0, 1] } },
      },
    },
  ]);
  return new Map(rows.map((r) => [String(r._id), { total: r.total, pending: r.pending }]));
}

export async function listLists(userId: string) {
  const lists = await GroceryListModel.find(accessFilter(userId)).sort({ updatedAt: -1 });
  const counts = await countsFor(lists.map((l) => l._id));
  return Promise.all(lists.map((l) => present(l, userId, counts.get(String(l._id)))));
}

export async function getList(userId: string, listId: string) {
  const list = await findAccessible(userId, listId);
  const items = await GroceryItemModel.find({ list: list._id }).sort({ purchased: 1, createdAt: 1 });
  const pending = items.filter((i) => !i.purchased).length;
  return { ...(await present(list, userId, { total: items.length, pending })), items };
}

export async function createList(userId: string, name: string) {
  const list = await GroceryListModel.create({ owner: userId, name });
  return present(list, userId);
}

export async function renameList(userId: string, listId: string, name: string) {
  const list = await findAccessible(userId, listId);
  list.name = name;
  await list.save();
  return getList(userId, listId);
}

export async function deleteList(userId: string, listId: string) {
  const list = await findOwnedList(userId, listId);
  await GroceryItemModel.deleteMany({ list: list._id });
  await list.deleteOne();
}

// Every item change touches the parent so "recently used" ordering and
// other devices' refresh both see the list as changed.
const touch = (listId: Types.ObjectId) => GroceryListModel.updateOne({ _id: listId }, { $currentDate: { updatedAt: true } });

export async function addItem(userId: string, listId: string, input: CreateItemInput) {
  const list = await findAccessible(userId, listId);
  const count = await GroceryItemModel.countDocuments({ list: list._id });
  if (count >= 300) throw badRequest('This list is full. Clear purchased items first.');
  const item = await GroceryItemModel.create({ ...input, list: list._id, addedBy: userId });
  await touch(list._id);
  return item;
}

export async function updateItem(userId: string, listId: string, itemId: string, input: UpdateItemInput) {
  const list = await findAccessible(userId, listId);
  const set: Record<string, unknown> = { ...input };
  if (input.purchased !== undefined) set.purchasedAt = input.purchased ? new Date() : null;
  const item = await GroceryItemModel.findOneAndUpdate({ _id: itemId, list: list._id }, { $set: set }, {
    returnDocument: 'after',
    runValidators: true,
  });
  if (!item) throw notFound('Item');
  await touch(list._id);
  return item;
}

export async function deleteItem(userId: string, listId: string, itemId: string) {
  const list = await findAccessible(userId, listId);
  const result = await GroceryItemModel.deleteOne({ _id: itemId, list: list._id });
  if (result.deletedCount === 0) throw notFound('Item');
  await touch(list._id);
}

export async function clearPurchased(userId: string, listId: string) {
  const list = await findAccessible(userId, listId);
  const result = await GroceryItemModel.deleteMany({ list: list._id, purchased: true });
  await touch(list._id);
  return { removed: result.deletedCount };
}

export async function shareList(userId: string, listId: string, email: string) {
  const list = await findOwnedList(userId, listId);
  const invitee = await UserModel.findOne({ email }).select('_id');
  // Sharing needs the invitee to be registered (proposal §11). Only the list
  // owner can reach this check, which keeps account probing rate-bound.
  if (!invitee) throw new AppError(404, 'NOT_FOUND', 'No LifeMate account uses that email.');
  if (String(invitee._id) === userId) throw badRequest('You already own this list.');
  if (list.members.some((m) => String(m) === String(invitee._id))) throw conflict('This person already has access.');
  if (list.members.length >= MAX_MEMBERS) throw badRequest(`A list can be shared with up to ${MAX_MEMBERS} people.`);
  list.members.push(invitee._id);
  await list.save();
  return getList(userId, listId);
}

/** Owners can remove anyone; members can remove themselves (leave). */
export async function removeMember(userId: string, listId: string, memberId: string) {
  const list = await findAccessible(userId, listId);
  const isOwner = String(list.owner) === userId;
  if (!isOwner && memberId !== userId) throw forbidden('Only the list owner can remove other people.');
  const before = list.members.length;
  list.members = list.members.filter((m) => String(m) !== memberId) as typeof list.members;
  if (list.members.length === before) throw notFound('Member');
  await list.save();
  return isOwner ? getList(userId, listId) : null;
}

import type { RequestHandler } from 'express';
import * as service from './grocery.service.js';

export const listLists: RequestHandler = async (_req, res) => {
  res.json({ data: await service.listLists(res.locals.userId) });
};

export const getList: RequestHandler = async (_req, res) => {
  res.json({ data: await service.getList(res.locals.userId, res.locals.params.id) });
};

export const createList: RequestHandler = async (_req, res) => {
  res.status(201).json({ data: await service.createList(res.locals.userId, res.locals.body.name) });
};

export const renameList: RequestHandler = async (_req, res) => {
  res.json({ data: await service.renameList(res.locals.userId, res.locals.params.id, res.locals.body.name) });
};

export const deleteList: RequestHandler = async (_req, res) => {
  await service.deleteList(res.locals.userId, res.locals.params.id);
  res.status(204).end();
};

export const addItem: RequestHandler = async (_req, res) => {
  res.status(201).json({ data: await service.addItem(res.locals.userId, res.locals.params.id, res.locals.body) });
};

export const updateItem: RequestHandler = async (_req, res) => {
  const { id, itemId } = res.locals.params;
  res.json({ data: await service.updateItem(res.locals.userId, id, itemId, res.locals.body) });
};

export const deleteItem: RequestHandler = async (_req, res) => {
  const { id, itemId } = res.locals.params;
  await service.deleteItem(res.locals.userId, id, itemId);
  res.status(204).end();
};

export const clearPurchased: RequestHandler = async (_req, res) => {
  res.json({ data: await service.clearPurchased(res.locals.userId, res.locals.params.id) });
};

export const share: RequestHandler = async (_req, res) => {
  res.json({ data: await service.shareList(res.locals.userId, res.locals.params.id, res.locals.body.email) });
};

export const removeMember: RequestHandler = async (_req, res) => {
  const { id, userId } = res.locals.params;
  const list = await service.removeMember(res.locals.userId, id, userId);
  if (list) res.json({ data: list });
  else res.status(204).end();
};

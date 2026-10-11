import type { RequestHandler } from 'express';
import * as service from './expense.service.js';

export const list: RequestHandler = async (_req, res) => {
  const { items, nextCursor } = await service.listExpenses(res.locals.userId, res.locals.query);
  res.json({ data: items, nextCursor });
};

export const summary: RequestHandler = async (_req, res) => {
  res.json({ data: await service.monthSummary(res.locals.userId, res.locals.query.month) });
};

export const create: RequestHandler = async (_req, res) => {
  const { expense, alerts } = await service.createExpense(res.locals.userId, res.locals.body);
  res.status(201).json({ data: expense, alerts });
};

export const update: RequestHandler = async (_req, res) => {
  res.json({ data: await service.updateExpense(res.locals.userId, res.locals.params.id, res.locals.body) });
};

export const remove: RequestHandler = async (_req, res) => {
  await service.deleteExpense(res.locals.userId, res.locals.params.id);
  res.status(204).end();
};
